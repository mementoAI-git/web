import { memo, useCallback, useEffect, useMemo, useRef, useState, type Ref } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Captions, CaptionsOff, Mic, Music, Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import endpoint from "@/api/endpoint";
import { post } from "@/api/mutations";
import {
  SKIP_SECONDS,
  alignTurnsToSpeech,
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
import "./transcript-player.css";

/**
 * The audio player in the file preview, matching the mobile app's
 * TranscriptAudioPlayer (top to bottom):
 *  - the transcript, streaming word by word with playback and following the
 *    active turn (artwork or a voice visual when there is none)
 *  - a timeline where speech shows in purple, with a playhead; click or drag to seek
 *  - elapsed `mm:ss` and remaining `-mm:ss`
 *  - speed, back 5s, play/pause, forward 5s, transcript on/off
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
  return (
    <button
      ref={rowRef}
      type="button"
      onClick={() => onSeek(turn.start)}
      aria-label={`${label ? `${label}, ` : ""}${formatClock(turn.start)}. ${turn.text}`}
      aria-description="Plays from here"
      aria-current={state === "active" ? "true" : undefined}
      className="flex w-full cursor-pointer flex-col gap-1.5 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-stroke-neutral-strong"
    >
      <span className="flex items-center gap-2 font-geist text-sm font-normal text-text-neutral-weak" aria-hidden>
        {label ? <span>{label}</span> : null}
        <span className="tabular-nums">{formatClock(turn.start)}</span>
      </span>
      <span aria-hidden className="font-geist text-lg leading-7">
        {state === "active" ? (
          <>
            <span className="text-text-neutral-strong">{turn.text.slice(0, spoken)}</span>
            <span className="text-text-neutral-weak">{turn.text.slice(spoken)}</span>
          </>
        ) : (
          <span className={state === "past" ? "text-text-neutral-weak" : "text-text-neutral-weaker"}>{turn.text}</span>
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
      className="transcript-fade hide-scrollbar relative min-h-0 flex-1 overflow-y-auto overscroll-contain"
    >
      <div className="flex flex-col gap-6 pb-[120px] pt-10">
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
function AudioVisual({ artwork, voice, title }: { artwork?: string | null; voice: boolean; title: string }) {
  const Icon = voice ? Mic : Music;
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
      {artwork ? (
        <img src={artwork} alt="" className="size-[220px] rounded-3xl bg-fill-neutral-weak object-cover" />
      ) : (
        <span className="transcript-quiet-fill flex size-40 items-center justify-center rounded-[32px] bg-fill-neutral-weak text-icon-brand-strong">
          <Icon className="size-11" strokeWidth={1.6} aria-hidden />
        </span>
      )}
      <p className="line-clamp-2 text-center font-geist text-lg text-text-neutral-strong">{title}</p>
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
          blocks.map((block) => (
            <span
              key={block.key}
              data-testid="speech-block"
              className="absolute inset-y-0 bg-fill-speech"
              style={{ left: `${block.left * 100}%`, width: `${block.width * 100}%` }}
            />
          ))
        ) : (
          <span data-testid="timeline-progress" className="absolute inset-y-0 left-0 bg-fill-tab-active" style={{ width: `${progress * 100}%` }} />
        )}
      </span>
      <span
        aria-hidden
        className="transcript-playhead pointer-events-none absolute top-1/2 h-7 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fill-tab-active"
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
  const segments = useMemo(() => transcription.data?.segments ?? [], [transcription.data]);
  // Recorded conversations know when someone was audible; turns and words follow that.
  const recordedSpeech = useMemo(() => transcription.data?.speech ?? [], [transcription.data]);
  const turns = useMemo(
    () => alignTurnsToSpeech(mergeTranscriptTurns(segments), recordedSpeech),
    [segments, recordedSpeech],
  );
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

  let body;
  if (showTranscript && transcription.isLoading) {
    body = (
      <div role="status" className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
        <span aria-hidden className="size-6 animate-spin rounded-full border-2 border-stroke-neutral-weak border-t-icon-brand-strong motion-reduce:animate-none" />
        <span className="font-geist text-sm text-text-neutral-weak">Transcribing…</span>
      </div>
    );
  } else if (showTranscript && turns.length) {
    body = <TranscriptView turns={turns} speech={recordedSpeech} currentTime={currentTime} showSpeakers={multiSpeaker} onSeek={seekTo} />;
  } else {
    body = <AudioVisual artwork={voice ? null : thumbnail} voice={voice} title={title} />;
  }

  return (
    <div
      data-testid="transcript-audio-player"
      className="flex h-[min(720px,calc(100dvh-160px))] w-full max-w-[560px] flex-col gap-5 overflow-hidden rounded-3xl border border-stroke-neutral-weak bg-bg-neutral-solid px-6 pb-6 pt-2 text-text-neutral-strong shadow-2xl"
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

      {body}

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
    </div>
  );
}
