import { useCallback, useEffect, useRef, useState, type Ref } from "react";
import dayjs from "dayjs";
import { Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { Backward15Icon, Forward15Icon } from "@/components/icons";
import { placeholderPeaks, useAudioPeaks } from "@/hooks/use-audio-peaks";
import { cn } from "@/utility";
import Transcription from "./transcription";

const PIXELS_PER_SECOND = 100;
const BARS_PER_SECOND = 25;
const RULER_HEIGHT = 28;
const SPEEDS = [1, 1.25, 1.5, 2, 0.75];

function formatClock(seconds: number) {
  const safe = Math.max(0, seconds);
  const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
  const wholeSeconds = String(Math.floor(safe % 60)).padStart(2, "0");
  const hundredths = String(Math.floor((safe % 1) * 100)).padStart(2, "0");
  return `${minutes}:${wholeSeconds}.${hundredths}`;
}

function formatLength(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function formatRecordedAt(timestamp: number) {
  const date = dayjs(timestamp);
  if (date.isSame(dayjs(), "day")) return `Today, ${date.format("h:mm A")}`;
  return date.format(date.isSame(dayjs(), "year") ? "MMM D, h:mm A" : "MMM D, YYYY");
}

export default function VoicePlayer({
  src,
  id,
  title,
  recordedAt,
  duration = 0,
  audioRef,
  onError,
}: {
  src: string;
  id?: string;
  title: string;
  recordedAt?: number | null;
  duration?: number;
  audioRef?: Ref<HTMLAudioElement>;
  onError?: React.ReactEventHandler<HTMLAudioElement>;
}) {
  const media = useRef<HTMLAudioElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const strip = useRef<HTMLDivElement | null>(null);
  const trackProbe = useRef<HTMLSpanElement | null>(null);
  const clock = useRef<HTMLSpanElement | null>(null);
  const position = useRef(0);
  const frame = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [mediaDuration, setMediaDuration] = useState(0);
  const [transcriptTime, setTranscriptTime] = useState(0);
  const key = id || src;
  const shape = useAudioPeaks(key, src);
  const total = mediaDuration || shape?.duration || duration || 0;

  const draw = useCallback(() => {
    const surface = canvas.current;
    const context = surface?.getContext("2d");
    if (!surface || !context) return;
    const scale = window.devicePixelRatio || 1;
    const width = surface.clientWidth;
    const height = surface.clientHeight;
    if (surface.width !== width * scale || surface.height !== height * scale) {
      surface.width = width * scale;
      surface.height = height * scale;
    }
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, width, height);

    const styles = getComputedStyle(surface);
    const barColor = styles.color;
    const mutedColor = styles.borderTopColor;
    const trackColor = trackProbe.current
      ? getComputedStyle(trackProbe.current).backgroundColor
      : "transparent";
    const waveHeight = height - RULER_HEIGHT;
    const middle = waveHeight / 2;
    const now = position.current;
    const xFor = (seconds: number) => width / 2 + (seconds - now) * PIXELS_PER_SECOND;

    // The track only exists between the start and end of the recording.
    context.fillStyle = trackColor;
    const trackStart = Math.max(0, xFor(0));
    const trackEnd = Math.min(width, total ? xFor(total) : width);
    if (trackEnd > trackStart) {
      context.fillRect(trackStart, 0, trackEnd - trackStart, waveHeight);
    }

    const barTotal = Math.max(1, Math.ceil((total || 1) * BARS_PER_SECOND));
    const source = shape?.peaks ?? placeholderPeaks(key, barTotal);
    context.fillStyle = barColor;
    const firstBar = Math.max(0, Math.floor((now - width / 2 / PIXELS_PER_SECOND) * BARS_PER_SECOND));
    const lastBar = Math.min(barTotal, Math.ceil((now + width / 2 / PIXELS_PER_SECOND) * BARS_PER_SECOND));
    for (let bar = firstBar; bar < lastBar; bar += 1) {
      const from = Math.floor((bar / barTotal) * source.length);
      const to = Math.max(from + 1, Math.floor(((bar + 1) / barTotal) * source.length));
      let level = 0;
      for (let at = from; at < to && at < source.length; at += 1) {
        level = Math.max(level, source[at]);
      }
      const barHeight = Math.max(2, level * (waveHeight - 32));
      context.fillRect(xFor(bar / BARS_PER_SECOND), middle - barHeight / 2, 2, barHeight);
    }

    context.fillStyle = mutedColor;
    context.font = "12px var(--font-geist), system-ui, sans-serif";
    context.textBaseline = "top";
    const firstTick = Math.max(0, Math.floor((now - width / 2 / PIXELS_PER_SECOND) * 4));
    const lastTick = Math.ceil((now + width / 2 / PIXELS_PER_SECOND) * 4);
    for (let tick = firstTick; tick <= lastTick; tick += 1) {
      const seconds = tick / 4;
      if (total && seconds > total) break;
      const major = tick % 4 === 0;
      const x = xFor(seconds);
      context.fillRect(x, waveHeight, 1, major ? 8 : 4);
      if (major) {
        const whole = Math.round(seconds);
        context.fillText(
          `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`,
          x + 3,
          waveHeight + 10,
        );
      }
    }
  }, [key, shape, total]);

  const showPosition = useCallback(
    (seconds: number) => {
      position.current = seconds;
      if (clock.current) clock.current.textContent = formatClock(seconds);
      draw();
    },
    [draw],
  );

  useEffect(() => {
    draw();
    const surface = canvas.current;
    if (!surface || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => draw());
    observer.observe(surface);
    return () => observer.disconnect();
  }, [draw]);

  useEffect(() => {
    if (!playing) return;
    const tick = () => {
      const element = media.current;
      if (element) showPosition(element.currentTime);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    const transcript = window.setInterval(
      () => setTranscriptTime(media.current?.currentTime ?? 0),
      250,
    );
    return () => {
      cancelAnimationFrame(frame.current);
      window.clearInterval(transcript);
    };
  }, [playing, showPosition]);

  useEffect(() => {
    position.current = 0;
    setPlaying(false);
    setMediaDuration(0);
    setTranscriptTime(0);
    if (clock.current) clock.current.textContent = formatClock(0);
  }, [src]);

  const seekTo = (seconds: number) => {
    const element = media.current;
    const next = Math.max(0, total ? Math.min(total, seconds) : seconds);
    if (element) element.currentTime = next;
    setTranscriptTime(next);
    showPosition(next);
  };

  const togglePlay = () => {
    const element = media.current;
    if (!element) return;
    if (!element.paused) {
      element.pause();
      return;
    }
    element.playbackRate = speed;
    // Playing from the very end would finish instantly and need a second tap.
    if (total && element.currentTime >= total - 0.05) seekTo(0);
    void element.play().catch(() => {
      toast.error("Couldn’t play this recording. Try again.");
    });
  };

  const drag = useRef<{ pointer: number; x: number; from: number } | null>(null);

  return (
    <div
      data-testid="voice-player"
      className="flex w-full max-w-[460px] flex-col overflow-hidden rounded-3xl border border-stroke-neutral-weak bg-bg-neutral-solid text-text-neutral-strong shadow-2xl"
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
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(event) => {
          const value = event.currentTarget.duration;
          if (Number.isFinite(value) && value > 0) setMediaDuration(value);
        }}
        onDurationChange={(event) => {
          const value = event.currentTarget.duration;
          if (Number.isFinite(value) && value > 0) setMediaDuration(value);
        }}
        onEnded={() => seekTo(0)}
      />
      <div className="px-6 pb-4 pt-6 text-center">
        <h2 className="truncate font-garamond text-2xl leading-8">{title}</h2>
        <p className="mt-1 font-inter text-sm tabular-nums text-text-neutral-weak">
          {[total ? formatLength(total) : null, recordedAt ? formatRecordedAt(recordedAt) : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <div
        ref={strip}
        role="slider"
        tabIndex={0}
        aria-label="Playback position"
        aria-valuemin={0}
        aria-valuemax={Math.round(total)}
        aria-valuenow={Math.round(transcriptTime)}
        aria-valuetext={formatLength(transcriptTime)}
        className="relative h-[min(38dvh,300px)] cursor-grab touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-brand-strong active:cursor-grabbing"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") seekTo(position.current - 5);
          else if (event.key === "ArrowRight") seekTo(position.current + 5);
          else return;
          event.preventDefault();
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture?.(event.pointerId);
          drag.current = { pointer: event.pointerId, x: event.clientX, from: position.current };
        }}
        onPointerMove={(event) => {
          if (drag.current?.pointer !== event.pointerId) return;
          seekTo(drag.current.from - (event.clientX - drag.current.x) / PIXELS_PER_SECOND);
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <span ref={trackProbe} aria-hidden className="hidden bg-fill-neutral-weak" />
        <canvas
          ref={canvas}
          aria-hidden
          className="absolute inset-0 size-full border-text-neutral-weak text-icon-neutral-strong"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-fill-brand-strong"
          style={{ bottom: RULER_HEIGHT }}
        >
          <span className="absolute -left-[5px] -top-[5px] size-[11px] rounded-full bg-fill-brand-strong" />
          <span className="absolute -bottom-[5px] -left-[5px] size-[11px] rounded-full bg-fill-brand-strong" />
        </span>
      </div>

      <p className="pt-5 text-center font-geist text-[40px] font-semibold leading-none tabular-nums">
        <span ref={clock}>{formatClock(0)}</span>
      </p>

      <div className="flex items-center justify-between gap-2 px-6 pb-6 pt-5">
        <span className="w-11" aria-hidden />
        <button
          type="button"
          aria-label="Skip back 15 seconds"
          onClick={() => seekTo(position.current - 15)}
          className="flex size-11 cursor-pointer items-center justify-center rounded-full text-icon-neutral-strong transition-colors hover:bg-fill-neutral-weak"
        >
          <Backward15Icon width={26} />
        </button>
        <button
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          onClick={togglePlay}
          className="flex size-14 cursor-pointer items-center justify-center rounded-full bg-fill-brand-strong text-primary-foreground transition-opacity hover:opacity-90"
        >
          {playing ? (
            <Pause aria-hidden fill="currentColor" stroke="none" className="size-6 fill-current" />
          ) : (
            <Play aria-hidden fill="currentColor" stroke="none" className="size-6 translate-x-0.5 fill-current" />
          )}
        </button>
        <button
          type="button"
          aria-label="Skip forward 15 seconds"
          onClick={() => seekTo(position.current + 15)}
          className="flex size-11 cursor-pointer items-center justify-center rounded-full text-icon-neutral-strong transition-colors hover:bg-fill-neutral-weak"
        >
          <Forward15Icon width={26} />
        </button>
        <button
          type="button"
          aria-label={`Playback speed ${speed}x`}
          onClick={() => {
            const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
            setSpeed(next);
            if (media.current) media.current.playbackRate = next;
          }}
          className={cn(
            "flex h-11 w-11 cursor-pointer items-center justify-center rounded-full font-geist text-sm font-medium tabular-nums text-text-neutral-strong transition-colors hover:bg-fill-neutral-weak",
          )}
        >
          {speed}×
        </button>
      </div>
      {id ? (
        <div className="max-h-[24dvh] overflow-y-auto px-6 pb-6">
          <Transcription id={id} currentTime={transcriptTime} />
        </div>
      ) : null}
    </div>
  );
}
