import { useEffect, useRef, useState } from "react";
import { Pause, Play, X } from "lucide-react";
import { toast } from "sonner";
import {
  placeholderPeaks,
  resamplePeaks,
  useAudioPeaks,
} from "@/hooks/use-audio-peaks";
import { useSignedMediaAccess } from "@/features/media/signed-media-access";
import { cn } from "@/utility";
import type { IFile } from "@/utility/interface";

/** Only one clip plays at a time across the page. */
let activeClip: HTMLAudioElement | null = null;

function formatClipTime(totalSeconds: number) {
  const safe = Math.max(0, Math.round(totalSeconds || 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function useClipPlayback(src: string, onFailed?: () => void) {
  const clip = useRef<HTMLAudioElement | null>(null);
  const frame = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);

  const stop = () => {
    cancelAnimationFrame(frame.current);
    clip.current?.pause();
    clip.current = null;
  };
  useEffect(() => stop, []);
  useEffect(() => {
    stop();
    setPlaying(false);
    setPosition(0);
  }, [src]);

  const toggle = () => {
    if (!src) return;
    if (clip.current && !clip.current.paused) {
      clip.current.pause();
      return;
    }
    const element = clip.current ?? new Audio(src);
    if (!clip.current) {
      clip.current = element;
      element.addEventListener("play", () => {
        setPlaying(true);
        const tick = () => {
          setPosition(element.currentTime);
          frame.current = requestAnimationFrame(tick);
        };
        tick();
      });
      element.addEventListener("pause", () => {
        cancelAnimationFrame(frame.current);
        setPlaying(false);
      });
      element.addEventListener("ended", () => {
        element.currentTime = 0;
        setPosition(0);
      });
      element.addEventListener("error", () => onFailed?.());
    }
    if (activeClip && activeClip !== element) activeClip.pause();
    activeClip = element;
    void element.play().catch(() => {
      toast.error("Couldn’t play this recording. Try again.");
    });
  };
  return { playing, position, toggle };
}

export function VoiceNoteTile({
  id,
  src,
  duration,
  label,
  compact = false,
  interactive = true,
  onOpen,
  onRemove,
  onError,
  className,
}: {
  id: string;
  src: string;
  duration?: number;
  /** What the clip is called, for screen readers. */
  label: string;
  compact?: boolean;
  /** False when a parent control already opens the clip, as nested buttons aren't allowed. */
  interactive?: boolean;
  onOpen?: () => void;
  onRemove?: () => void;
  onError?: () => void;
  className?: string;
}) {
  const shape = useAudioPeaks(id, src);
  const { playing, position, toggle } = useClipPlayback(src, onError);
  const barCount = compact ? 18 : 28;
  const bars = shape
    ? resamplePeaks(shape.peaks, barCount)
    : placeholderPeaks(id, barCount);
  const total = shape?.duration || duration || 0;
  const played = total ? Math.min(1, position / total) : 0;
  const playIcon = compact ? "size-3.5" : "size-5";

  return (
    <div
      data-testid="voice-note-tile"
      className={cn(
        "relative isolate flex size-[168px] flex-col overflow-hidden rounded-2xl border border-stroke-neutral-weaker bg-fill-neutral-weak text-left",
        compact ? "gap-1.5 p-2" : "gap-3 p-3",
        className,
      )}
    >
      {onOpen && interactive ? (
        <button
          type="button"
          aria-label={`Open ${label}`}
          onClick={onOpen}
          className="absolute inset-0 z-0 cursor-pointer rounded-2xl outline-none hover:bg-fill-neutral-weaker focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-brand-strong"
        />
      ) : null}
      <div className="pointer-events-none relative z-10 flex items-center gap-2">
        {interactive ? (
          <button
            type="button"
            aria-label={playing ? "Pause voice note" : "Play voice note"}
            onClick={(event) => {
              event.stopPropagation();
              toggle();
            }}
            className={cn(
              "pointer-events-auto flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-fill-brand-strong text-primary-foreground transition-opacity hover:opacity-90",
              compact ? "size-7" : "size-10",
            )}
          >
            {playing ? (
              <Pause aria-hidden fill="currentColor" stroke="none" className={cn(playIcon, "fill-current")} />
            ) : (
              <Play aria-hidden fill="currentColor" stroke="none" className={cn(playIcon, "translate-x-px fill-current")} />
            )}
          </button>
        ) : (
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-fill-brand-strong text-primary-foreground"
          >
            <Play fill="currentColor" stroke="none" className="size-3.5 translate-x-px" />
          </span>
        )}
        <span
          className={cn(
            "font-geist tabular-nums text-text-neutral-weak",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {formatClipTime(playing || position ? position : total)}
        </span>
      </div>
      <div
        aria-hidden
        className="pointer-events-none relative z-10 flex min-h-0 flex-1 items-center justify-between"
      >
        {bars.map((level, index) => (
          <span
            key={index}
            className={cn(
              "w-[3px] rounded-full bg-fill-brand-strong transition-opacity duration-100",
              (index + 0.5) / bars.length <= played ? "opacity-100" : "opacity-40",
            )}
            style={{ height: `${Math.max(6, level * 100)}%` }}
          />
        ))}
      </div>
      {onRemove ? (
        <button
          type="button"
          aria-label="Remove voice note"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className="absolute right-1.5 top-1.5 z-20 flex size-6 cursor-pointer items-center justify-center rounded-full bg-fill-neutral-strong/60 text-text-inverse-strong transition-opacity hover:opacity-90"
        >
          <X aria-hidden className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

/** A tile for a saved attachment, which refreshes its signed link when it expires. */
export function SavedVoiceNoteTile({
  file,
  ...props
}: { file: IFile } & Omit<
  React.ComponentProps<typeof VoiceNoteTile>,
  "id" | "src" | "duration" | "onError"
>) {
  const { src, onError } = useSignedMediaAccess(file);
  return (
    <VoiceNoteTile
      id={file._id || file.url}
      src={src}
      duration={file.duration}
      onError={onError as unknown as () => void}
      {...props}
    />
  );
}
