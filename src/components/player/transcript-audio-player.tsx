import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type Ref } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Captions, CaptionsOff, Mic, Music, Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import endpoint from "@/api/endpoint";
import { post } from "@/api/mutations";
import {
  SKIP_SECONDS,
  alignSegmentsToSpeech,
  clampSkip,
  computeTimelineBlocks,
  findActiveIndex,
  formatClock,
  formatRemaining,
  fractionFromX,
  hasSpeakers,
  isVoiceRecording,
  mergeTranscriptTurns,
  parseFileTranscription,
  resolveTimelineDuration,
  speakerLabel,
  spokenCharCount,
  type FileTranscription,
  type SpeechSpanSeconds,
  type TranscriptTurn,
} from "@/features/audio/transcript-player";
import { isVoiceConversationName } from "@/utility/file-label";
import { cn } from "@/utility";
import "./transcript-player.css";

/**
 * The audio player page in the file preview, laid out like a recorded call:
 *  - the player card: artwork or a voice visual; a timeline where speech shows
 *    in purple, with a playhead (click or drag to seek); elapsed `mm:ss` and
 *    remaining `-mm:ss`; speed, back 5s, play/pause, forward 5s, transcript on/off
 *  - beside it (below on phones): the page heading (title, date, actions), then
 *    the transcript, with a speaker column, the member's words in the brand
 *    colour, and the word being spoken highlighted as the voice plays
 */

const PLAYBACK_SPEEDS = [1, 1.25, 1.5] as const;
/** How long following the active turn waits after the host scrolls the transcript. */
const MANUAL_SCROLL_PAUSE_MS = 4000;
/** Where the active turn sits in the transcript (fraction from the top). */
const ACTIVE_TURN_ANCHOR = 0.3;
/** Treat the last moment of the file as the end, so play restarts from 0. */
const END_EPSILON_SECONDS = 0.25;

async function fetchTranscription(fileId: string): Promise<FileTranscription> {
  // The server transcribes on the first request and keeps the result.
  const response = await post(endpoint.transcription, { file_id: fileId }, { timeout: 60_000, skipErrorHandling: true });
  const transcription = parseFileTranscription(response?.data);
  if (!transcription) throw new Error("Transcription was empty");
  return transcription;
}

type TurnState = "past" | "active" | "future";

/** Where the word being spoken starts and ends, given how many characters have been spoken. */
function currentWord(text: string, spoken: number): [number, number] | null {
  if (spoken <= 0) return null;
  const at = Math.min(spoken, text.length) - 1;
  let start = at;
  while (start > 0 && !/\s/.test(text[start - 1])) start -= 1;
  let end = at + 1;
  while (end < text.length && !/\s/.test(text[end])) end += 1;
  return /\s/.test(text[at]) ? null : [start, end];
}

const TranscriptTurnRow = memo(function TranscriptTurnRow({
  turn,
  state,
  spoken,
  showSpeaker,
  onSeek,
  rowRef,
}: {
  turn: TranscriptTurn;
  state: TurnState;
  /** Characters of the active turn already spoken. */
  spoken: number;
  showSpeaker: boolean;
  onSeek: (seconds: number) => void;
  rowRef: (element: HTMLButtonElement | null) => void;
}) {
  const label = showSpeaker ? speakerLabel(turn.speaker) : null;
  // The member's words read in the brand colour; Memento's in the strong text colour.
  // (Light sky swaps the orange for a dark ink; see transcript-player.css.)
  const tone = showSpeaker && turn.speaker === "user" ? "transcript-you text-text-brand-strong" : "text-text-neutral-strong";
  const word = state === "active" ? currentWord(turn.text, spoken) : null;
  const upcoming = "opacity-45";
  return (
    <button
      ref={rowRef}
      type="button"
      onClick={() => onSeek(turn.start)}
      aria-label={`${label ? `${label}, ` : ""}${formatClock(turn.start)}. ${turn.text}`}
      aria-description="Plays from here"
      aria-current={state === "active" ? "true" : undefined}
      data-speaker={turn.speaker ?? undefined}
      className={cn(
        "grid w-full cursor-pointer gap-x-4 gap-y-1 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-stroke-neutral-strong",
        label ? "grid-cols-[76px_minmax(0,1fr)]" : "grid-cols-1",
      )}
    >
      <span className="flex flex-col gap-0.5 pt-1 font-mono text-xs uppercase tracking-[0.08em] text-text-neutral-weak" aria-hidden>
        {label ? <span>{label}</span> : null}
        <span className="tabular-nums text-text-neutral-weaker">{formatClock(turn.start)}</span>
      </span>
      <span aria-hidden className={cn("font-geist text-lg leading-8", tone)}>
        {state === "active" ? (
          word ? (
            <>
              <span>{turn.text.slice(0, word[0])}</span>
              <span data-testid="spoken-word" className="rounded-[4px] bg-fill-brand-strong text-text-inverse-strong shadow-[0_0_0_2px_var(--fill-brand-strong)] [box-decoration-break:clone]">
                {turn.text.slice(word[0], word[1])}
              </span>
              <span className={upcoming}>{turn.text.slice(word[1])}</span>
            </>
          ) : (
            <>
              <span>{turn.text.slice(0, spoken)}</span>
              <span className={upcoming}>{turn.text.slice(spoken)}</span>
            </>
          )
        ) : (
          <span className={state === "future" ? upcoming : undefined}>{turn.text}</span>
        )}
      </span>
    </button>
  );
});

function TranscriptView({
  turns,
  speech,
  currentTime,
  showSpeakers,
  onSeek,
}: {
  turns: TranscriptTurn[];
  /** When someone was audible, so words light up with the voice. */
  speech?: readonly SpeechSpanSeconds[];
  currentTime: number;
  showSpeakers: boolean;
  onSeek: (seconds: number) => void;
}) {
  const scroller = useRef<HTMLDivElement | null>(null);
  const rows = useRef<(HTMLButtonElement | null)[]>([]);
  const lastManualScrollAt = useRef(0);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const settled = useRef(false);

  const activeIndex = findActiveIndex(turns, currentTime);
  // Before the first word, keep the first turn in focus.
  const focusIndex = Math.max(0, activeIndex);
  const focusIndexRef = useRef(focusIndex);
  focusIndexRef.current = focusIndex;
  const activeSpoken = activeIndex >= 0 ? spokenCharCount(turns[activeIndex], currentTime, speech) : 0;

  const scrollToTurn = useCallback((index: number, smooth = true) => {
    const container = scroller.current;
    const row = rows.current[index];
    if (!container || !row) return;
    const top = Math.max(0, row.offsetTop - container.clientHeight * ACTIVE_TURN_ANCHOR);
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (typeof container.scrollTo === "function") container.scrollTo({ top, behavior: smooth && !reduceMotion ? "smooth" : "auto" });
    else container.scrollTop = top;
  }, []);

  // Follow the active turn unless the host has just scrolled the transcript.
  useEffect(() => {
    if (!settled.current) {
      settled.current = true;
      scrollToTurn(focusIndex, false);
      return;
    }
    if (Date.now() - lastManualScrollAt.current < MANUAL_SCROLL_PAUSE_MS) return;
    scrollToTurn(focusIndex);
  }, [focusIndex, scrollToTurn]);

  useEffect(() => () => clearTimeout(resumeTimer.current), []);

  // Wheel, touch and keys are the host scrolling; scroll events also fire for our own scrolls.
  const markManualScroll = useCallback(() => {
    lastManualScrollAt.current = Date.now();
    clearTimeout(resumeTimer.current);
    // Once the pause is over, glide back to wherever playback has got to.
    resumeTimer.current = setTimeout(() => scrollToTurn(focusIndexRef.current), MANUAL_SCROLL_PAUSE_MS);
  }, [scrollToTurn]);

  const seekTurn = useCallback((seconds: number) => {
    lastManualScrollAt.current = 0;
    clearTimeout(resumeTimer.current);
    onSeek(seconds);
  }, [onSeek]);

  return (
    <div
      ref={scroller}
      data-testid="audio-transcript"
      aria-label="Transcript"
      role="region"
      onWheel={markManualScroll}
      onTouchMove={markManualScroll}
      onKeyDown={(event) => {
        if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) markManualScroll();
      }}
      className="transcript-fade hide-scrollbar relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6"
    >
      <div className="flex flex-col gap-5 pb-[120px] pt-7">
        {turns.map((turn, index) => (
          <TranscriptTurnRow
            key={turn.id}
            turn={turn}
            state={index === activeIndex ? "active" : index < activeIndex ? "past" : "future"}
            spoken={index === activeIndex ? activeSpoken : 0}
            showSpeaker={showSpeakers}
            onSeek={seekTurn}
            rowRef={(element) => { rows.current[index] = element; }}
          />
        ))}
      </div>
    </div>
  );
}

/** Music and untranscribed audio: artwork, or a mic or note on a tile. */
function AudioVisual({ artwork, identicon, voice, title }: { artwork?: string | null; identicon?: string; voice: boolean; title?: string }) {
  const Icon = voice ? Mic : Music;
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
      {artwork ? (
        <img src={artwork} alt="" className="size-[220px] rounded-3xl bg-fill-neutral-weak object-cover" />
      ) : identicon ? (
        // The story's identicon, as on its thumbnail in My Stories.
        <img data-testid="audio-identicon" src={identicon} alt="" className="size-40 rounded-[32px] object-cover" referrerPolicy="no-referrer" />
      ) : (
        <span className="transcript-quiet-fill flex size-40 items-center justify-center rounded-[32px] bg-fill-neutral-weak text-icon-brand-strong">
          <Icon className="size-11" strokeWidth={1.6} aria-hidden />
        </span>
      )}
      {title ? <p className="line-clamp-2 text-center font-geist text-lg text-text-neutral-strong">{title}</p> : null}
    </div>
  );
}

function Timeline({
  speech,
  duration,
  currentTime,
  onScrub,
  onSeek,
}: {
  /** Spans where someone was speaking. */
  speech: { start: number; end: number }[];
  duration: number;
  currentTime: number;
  onScrub: (seconds: number | null) => void;
  onSeek: (seconds: number) => void;
}) {
  const blocks = useMemo(() => computeTimelineBlocks(speech, duration), [speech, duration]);
  const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const dragging = useRef<number | null>(null);
  const timeAt = (clientX: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    return fractionFromX(clientX - rect.left, rect.width) * duration;
  };

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Playback position"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(currentTime)}
      aria-valuetext={`${formatClock(currentTime)} of ${formatClock(duration)}`}
      className="relative flex h-11 cursor-pointer touch-none select-none items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-stroke-neutral-strong"
      onKeyDown={(event) => {
        const step = event.key === "ArrowLeft" ? -SKIP_SECONDS : event.key === "ArrowRight" ? SKIP_SECONDS : null;
        if (step !== null) onSeek(currentTime + step);
        else if (event.key === "Home") onSeek(0);
        else if (event.key === "End") onSeek(duration);
        else return;
        event.preventDefault();
      }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture?.(event.pointerId);
        dragging.current = event.pointerId;
        onScrub(timeAt(event.clientX, event.currentTarget));
      }}
      onPointerMove={(event) => {
        if (dragging.current === event.pointerId) onScrub(timeAt(event.clientX, event.currentTarget));
      }}
      onPointerUp={(event) => {
        if (dragging.current !== event.pointerId) return;
        dragging.current = null;
        onSeek(timeAt(event.clientX, event.currentTarget));
        onScrub(null);
      }}
      onPointerCancel={() => {
        dragging.current = null;
        onScrub(null);
      }}
    >
      <span aria-hidden className="transcript-quiet-fill relative h-3.5 w-full overflow-hidden rounded-full bg-fill-neutral-weak">
        {speech.length ? (
          // Speech in the theme's strong ink (white on dark, near-black on light sky):
          // full strength where it has played, dimmed where it hasn't yet.
          [false, true].map((played) => (
            <span
              key={played ? "played" : "ahead"}
              aria-hidden
              className={cn("absolute inset-0", played ? "" : "opacity-35")}
              style={played ? { clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)` } : undefined}
            >
              {blocks.map((block) => (
                <span
                  key={block.key}
                  data-testid={played ? undefined : "speech-block"}
                  className="absolute inset-y-0 bg-text-neutral-strong"
                  style={{ left: `${block.left * 100}%`, width: `${block.width * 100}%` }}
                />
              ))}
            </span>
          ))
        ) : (
          <span data-testid="timeline-progress" className="absolute inset-y-0 left-0 bg-fill-tab-active" style={{ width: `${progress * 100}%` }} />
        )}
      </span>
      <span
        aria-hidden
        className="transcript-playhead pointer-events-none absolute top-1/2 h-7 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-text-neutral-strong"
        style={{ left: `${progress * 100}%` }}
      />
    </div>
  );
}

function SkipButton({ direction, onClick }: { direction: "back" | "forward"; onClick: () => void }) {
  const Icon = direction === "back" ? RotateCcw : RotateCw;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "back" ? `Back ${SKIP_SECONDS} seconds` : `Forward ${SKIP_SECONDS} seconds`}
      className="transcript-quiet-fill relative flex size-16 cursor-pointer items-center justify-center rounded-full bg-fill-neutral-weak text-icon-neutral-strong outline-none transition-[transform,opacity] duration-150 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-stroke-neutral-strong active:scale-95 motion-reduce:active:scale-100"
    >
      <Icon className="size-[30px]" strokeWidth={1.8} aria-hidden />
      {/* The rotate icons open at the top; this sits the number in the ring. */}
      <span aria-hidden className="absolute mt-0.5 font-geist text-[10px] font-semibold text-text-neutral-strong">{SKIP_SECONDS}</span>
    </button>
  );
}

export type TranscriptAudioPlayerProps = {
  src: string;
  /** Saved file id; the transcript is only requested for saved files. */
  fileId?: string;
  name?: string;
  isVoice?: boolean;
  /** Album art from the server, for music. */
  thumbnail?: string | null;
  /** Known duration in seconds, shown until the audio loads. */
  duration?: number;
  /** False pauses playback, as when the preview moves to another file. */
  isActive?: boolean;
  audioRef?: Ref<HTMLAudioElement>;
  onError?: React.ReactEventHandler<HTMLAudioElement>;
  /** The page heading (title, date, actions): beside the player, above the transcript. */
  heading?: ReactNode;
  /** The story's identicon, shown when there's no artwork. */
  identicon?: string;
};

export default function TranscriptAudioPlayer({
  src,
  fileId,
  name,
  isVoice,
  thumbnail,
  duration: knownDuration = 0,
  isActive = true,
  audioRef,
  onError,
  heading,
  identicon,
}: TranscriptAudioPlayerProps) {
  const media = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(0);
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const [speed, setSpeed] = useState<(typeof PLAYBACK_SPEEDS)[number]>(1);

  const voice = isVoiceRecording({ isVoice, name });
  // The transcript shows by default for voice recordings and can be turned on for any saved audio.
  const [showTranscript, setShowTranscript] = useState(voice);
  const transcription = useSWR(
    fileId && showTranscript && isActive ? ["file-transcription", fileId] : null,
    () => fetchTranscription(fileId!),
    { revalidateOnFocus: false, revalidateIfStale: false, revalidateOnReconnect: false, errorRetryCount: 1 },
  );
  // Recorded conversations know when someone was audible; turns and words follow that.
  const recordedSpeech = useMemo(() => transcription.data?.speech ?? [], [transcription.data]);
  // Recorded calls note each turn when its text arrived; snap them to the speech actually heard.
  const segments = useMemo(
    () => alignSegmentsToSpeech(transcription.data?.segments ?? [], recordedSpeech),
    [transcription.data, recordedSpeech],
  );
  const turns = useMemo(() => mergeTranscriptTurns(segments), [segments]);
  const multiSpeaker = useMemo(() => hasSpeakers(segments), [segments]);
  // Recorded conversations know when someone was audible; otherwise the transcript stands in.
  const speech = useMemo(
    () => (recordedSpeech.length ? recordedSpeech : segments),
    [recordedSpeech, segments],
  );

  const duration = resolveTimelineDuration(mediaDuration || knownDuration, segments);
  const currentTime = scrubTime ?? position;

  useEffect(() => {
    if (!isActive) media.current?.pause();
  }, [isActive]);

  useEffect(() => {
    setPlaying(false);
    setPosition(0);
    setMediaDuration(0);
  }, [src]);

  // Every frame while playing, so the highlight and playhead keep up with the voice.
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      const element = media.current;
      if (element) setPosition((previous) => (previous === element.currentTime ? previous : element.currentTime));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const seekTo = useCallback((seconds: number) => {
    const target = clampSkip(seconds, 0, duration);
    if (media.current) media.current.currentTime = target;
    setPosition(target);
  }, [duration]);

  const togglePlay = () => {
    const element = media.current;
    if (!element) return;
    if (!element.paused) {
      element.pause();
      return;
    }
    element.playbackRate = speed;
    if (duration > 0 && element.currentTime >= duration - END_EPSILON_SECONDS) seekTo(0);
    void element.play().catch(() => toast.error("Couldn’t play this recording. Try again."));
  };

  const cycleSpeed = () => {
    const next = PLAYBACK_SPEEDS[(PLAYBACK_SPEEDS.indexOf(speed) + 1) % PLAYBACK_SPEEDS.length];
    setSpeed(next);
    if (media.current) media.current.playbackRate = next;
  };

  const title = voice
    ? isVoiceConversationName(name) ? "Voice conversation" : "Voice note"
    : name?.replace(/\.[^.]+$/, "").replace(/_\d{12,}$/, "").replace(/_/g, " ") || "Audio";

  let transcriptBody: ReactNode = null;
  if (showTranscript && transcription.isLoading) {
    transcriptBody = (
      <div role="status" className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
        <span aria-hidden className="size-6 animate-spin rounded-full border-2 border-stroke-neutral-weak border-t-icon-brand-strong motion-reduce:animate-none" />
        <span className="font-geist text-sm text-text-neutral-weak">Transcribing…</span>
      </div>
    );
  } else if (showTranscript && turns.length) {
    transcriptBody = <TranscriptView turns={turns} speech={recordedSpeech} currentTime={currentTime} showSpeakers={multiSpeaker} onSeek={seekTo} />;
  } else if (showTranscript && fileId && !transcription.isLoading) {
    transcriptBody = (
      <p className="flex flex-1 items-center justify-center p-6 text-center font-geist text-sm text-text-neutral-weak">
        No transcript for this recording.
      </p>
    );
  }

  return (
    <div
      data-testid="transcript-audio-player"
      className={cn(
        "grid w-full gap-5 text-text-neutral-strong lg:gap-x-8",
        "[grid-template-areas:'heading'_'player'_'transcript'] lg:[grid-template-areas:'player_heading'_'player_transcript']",
        "lg:h-[min(520px,calc(100dvh-180px))] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)]",
      )}
    >
      <audio
        ref={(element) => {
          media.current = element;
          if (typeof audioRef === "function") audioRef(element);
          else if (audioRef) (audioRef as React.MutableRefObject<HTMLAudioElement | null>).current = element;
        }}
        src={src}
        preload="auto"
        onError={(event) => {
          onError?.(event);
          toast.error("Couldn’t load this recording. Try again.");
        }}
        onPlay={() => setPlaying(true)}
        onPause={(event) => {
          setPlaying(false);
          setPosition(event.currentTarget.currentTime);
        }}
        onEnded={(event) => {
          setPlaying(false);
          setPosition(event.currentTarget.duration || 0);
        }}
        onSeeked={(event) => setPosition(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          const value = event.currentTarget.duration;
          if (Number.isFinite(value) && value > 0) setMediaDuration(value);
        }}
        onDurationChange={(event) => {
          const value = event.currentTarget.duration;
          if (Number.isFinite(value) && value > 0) setMediaDuration(value);
        }}
      />

      {heading ? <div className="min-w-0 [grid-area:heading]">{heading}</div> : null}

      <section
        aria-label="Player"
        className="transcript-quiet-fill flex flex-col gap-5 rounded-3xl border border-stroke-neutral-weak bg-fill-neutral-weaker p-5 [grid-area:player] sm:p-6 lg:min-h-0"
      >
        {/* On phones the transcript follows the player, so its visual gives way to it. */}
        <div className={cn("flex min-h-0 flex-1 flex-col", transcriptBody && "max-lg:hidden")}>
          <AudioVisual artwork={voice ? null : thumbnail} identicon={identicon} voice={voice} title={heading ? undefined : title} />
        </div>

      <div className="flex shrink-0 flex-col gap-0.5">
        <Timeline speech={speech} duration={duration} currentTime={currentTime} onScrub={setScrubTime} onSeek={seekTo} />
        <div className="flex justify-between font-mono text-xs tabular-nums text-text-neutral-weak">
          <span>{formatClock(currentTime)}</span>
          <span>{formatRemaining(currentTime, duration)}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between">
        <button
          type="button"
          onClick={cycleSpeed}
          aria-label={`Playback speed ${speed}x`}
          className="flex h-11 min-w-12 cursor-pointer items-center justify-center rounded-full font-geist text-sm font-semibold tabular-nums text-text-neutral-strong outline-none transition-colors hover:bg-fill-neutral-weak focus-visible:ring-2 focus-visible:ring-stroke-neutral-strong"
        >
          {speed}x
        </button>
        <SkipButton direction="back" onClick={() => seekTo(currentTime - SKIP_SECONDS)} />
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
          className="flex size-20 cursor-pointer items-center justify-center rounded-full bg-fill-tab-active text-text-tab-active outline-none transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-stroke-neutral-strong focus-visible:ring-offset-2 focus-visible:ring-offset-bg-neutral-solid active:scale-95 motion-reduce:active:scale-100"
        >
          {playing ? (
            <Pause aria-hidden fill="currentColor" stroke="none" className="size-[30px]" />
          ) : (
            <Play aria-hidden fill="currentColor" stroke="none" className="size-[30px] translate-x-[3px]" />
          )}
        </button>
        <SkipButton direction="forward" onClick={() => seekTo(currentTime + SKIP_SECONDS)} />
        {fileId ? (
          <button
            type="button"
            role="switch"
            aria-checked={showTranscript}
            aria-label="Transcript"
            onClick={() => setShowTranscript((shown) => !shown)}
            className="flex h-11 min-w-12 cursor-pointer items-center justify-center rounded-full outline-none transition-colors hover:bg-fill-neutral-weak focus-visible:ring-2 focus-visible:ring-stroke-neutral-strong"
          >
            {showTranscript
              ? <Captions className="size-6 text-icon-neutral-strong" strokeWidth={1.8} aria-hidden />
              : <CaptionsOff className="size-6 text-icon-neutral-weak" strokeWidth={1.8} aria-hidden />}
          </button>
        ) : (
          // Balances the speed button so play stays centred.
          <span aria-hidden className="h-11 min-w-12" />
        )}
      </div>
      </section>

      {transcriptBody ? (
        <div className="flex min-h-[320px] flex-col overflow-hidden rounded-3xl border border-stroke-neutral-weak bg-fill-neutral-weaker [grid-area:transcript] lg:min-h-0">
          {transcriptBody}
        </div>
      ) : null}
    </div>
  );
}
