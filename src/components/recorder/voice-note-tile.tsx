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

const PLAY_FAILED = "Couldn’t play this recording. Try again.";

/** Plays what's on this device when there is one, so a clip works before and despite its upload. */
function useLocalFileUrl(file?: File | null) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!file) {
      setUrl("");
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
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
    if (!src) {
      toast.error("This recording isn’t ready to play yet.");
      return;
    }
    if (clip.current && !clip.current.paused) {
      clip.current.pause();
      return;
    }
    const element = clip.current ?? new Audio(src);
    if (!clip.current) {
      clip.current = element;
      let retried = false;
      // Some browsers won't stream a link they could still play once fully downloaded.
      const recover = async () => {
        if (!retried && !src.startsWith("blob:") && !src.startsWith("data:")) {
          retried = true;
          try {
            const response = await fetch(src);
            if (response.ok) {
              element.src = URL.createObjectURL(await response.blob());
              await element.play();
              return;
            }
          } catch {
            /* Reported below. */
          }
        }
        onFailed?.();
        toast.error(PLAY_FAILED);
      };
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
      element.addEventListener("error", () => void recover());
    }
    if (activeClip && activeClip !== element) activeClip.pause();
    activeClip = element;
    void element.play().catch((cause: unknown) => {
      // The element's error event handles sources it can't load; this is everything else.
      if (!element.error) {
        toast.error(
          cause instanceof DOMException && cause.name === "NotAllowedError"
            ? "Your browser blocked playback. Tap play again."
            : PLAY_FAILED,
        );
      }
    });
  };
  return { playing, position, toggle };
}

export function VoiceNoteTile({
  id,
  src,
  localFile,
  duration,
  label,
  compact = false,
  interactive = true,
  onOpen,
  onRemove,
  onRetry,
  uploadProgress,
  onError,
  className,
}: {
  id: string;
  src: string;
  /** The recording itself, while it's still on this device. */
  localFile?: File | null;
  duration?: number;
  /** Set when the upload failed, to offer another try. */
  onRetry?: () => void;
  /** Percent uploaded, while that's still going on. */
  uploadProgress?: number;
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
  const localUrl = useLocalFileUrl(localFile);
  const playable = localUrl || src;
  const shape = useAudioPeaks(id, playable);
  const { playing, position, toggle } = useClipPlayback(playable, onError);
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
              (index + 0.5) / bars.length <= played ? "opacity-100" : "opacity-55",
            )}
            style={{ height: `${Math.max(6, level * 100)}%` }}
          />
        ))}
      </div>
      {uploadProgress !== undefined && uploadProgress < 100 ? (
        <div
          role="progressbar"
          aria-label="Uploading voice note"
          aria-valuenow={Math.round(uploadProgress)}
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1 bg-fill-neutral-weaker"
        >
          <div className="h-full bg-fill-brand-strong transition-[width]" style={{ width: `${Math.max(4, uploadProgress)}%` }} />
        </div>
      ) : null}
      {onRetry ? (
        <div className="relative z-10 flex items-center justify-between gap-2 font-inter text-xs text-text-neutral-weak">
          <span role="alert">Didn’t upload</span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRetry();
            }}
            className="cursor-pointer font-semibold text-text-brand-strong underline-offset-2 hover:underline"
          >
            Retry
          </button>
        </div>
      ) : null}
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
