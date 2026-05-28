"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { TimesIcon } from "@/components/icons";
import VideoPlayer from "@/components/player/video-player";
import type { IOnUploadPayload } from "@/utility/interface";
import { cn } from "@/utility";
import { inferMimeType } from "@/utility/constant";

const VOICE_BAR_COUNT = 44;

function formatTimestamp(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function mimeOf(f: IOnUploadPayload): string {
  return f.file?.type || f.uploadedFile?.type || inferMimeType(f.file?.name ?? f.uploadedFile?.name ?? "");
}

function durationOf(f: IOnUploadPayload): number {
  if (typeof f.duration === "number" && f.duration > 0) return f.duration;
  const d = f.uploadedFile?.duration;
  if (typeof d === "number" && d > 0) return d;
  if (typeof d === "string") {
    const n = parseFloat(d);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

function mediaSrc(f: IOnUploadPayload): string {
  if (f.base64 && String(f.base64).startsWith("data:")) return f.base64 as string;
  if (typeof f.uploadedFile?.url === "string" && f.uploadedFile.url) return f.uploadedFile.url;
  return "";
}

/** Deterministic bar heights per attachment so the shape doesn’t jump between renders. */
function barHeightsForId(id: string, count = VOICE_BAR_COUNT): number[] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Array.from({ length: count }, (_, i) => {
    const v = Math.sin((h + i * 997) * 0.013) * 0.5 + 0.5;
    return 5 + Math.round(v * 20);
  });
}

function WaveformBars({ active }: { active?: boolean }) {
  const heights = [12, 20, 16, 24, 14, 22, 10, 18, 26, 14, 20, 16];
  return (
    <div className="flex h-9 items-end justify-center gap-0.5">
      {heights.map((h, i) => (
        <span
          key={i}
          className={cn(
            "w-1 rounded-full bg-fill-brand-strong/75 transition-opacity duration-200",
            active && "opacity-100",
            !active && "opacity-70",
          )}
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

function VoiceWaveformProgress({
  progress,
  barHeights,
}: {
  progress: number;
  barHeights: number[];
}) {
  const n = barHeights.length;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <div className="flex h-10 w-full min-w-0 items-end gap-[2px]">
      {barHeights.map((h, i) => {
        const filled = (i + 0.5) / n <= p;
        return (
          <span
            key={i}
            className={cn(
              "min-w-0 flex-1 rounded-full transition-[background-color] duration-100",
              filled ? "bg-fill-brand-strong" : "bg-white/22",
            )}
            style={{ height: `${h}px`, maxHeight: "100%" }}
          />
        );
      })}
    </div>
  );
}

export function QuickCaptureMediaStack({
  files,
  voiceNoteIds,
  onRemove,
}: {
  files: IOnUploadPayload[];
  voiceNoteIds: Record<string, true>;
  onRemove: (id: string) => void;
}) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progressById, setProgressById] = useState<Record<string, number>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playingIdRef = useRef<string | null>(null);

  useEffect(() => {
    playingIdRef.current = playingId;
  }, [playingId]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const toggleVoicePlay = (id: string, src: string) => {
    if (!src) return;

    if (playingId === id) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingId(null);
      setProgressById((m) => ({ ...m, [id]: 0 }));
      return;
    }

    if (audioRef.current) {
      const prev = playingIdRef.current;
      audioRef.current.pause();
      audioRef.current = null;
      if (prev) setProgressById((m) => ({ ...m, [prev]: 0 }));
    }

    const el = new Audio(src);
    const onTime = () => {
      if (el.duration && Number.isFinite(el.duration)) {
        setProgressById((m) => ({ ...m, [id]: Math.min(1, el.currentTime / el.duration) }));
      }
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", () => {
      setPlayingId(null);
      setProgressById((m) => ({ ...m, [id]: 0 }));
      el.removeEventListener("timeupdate", onTime);
      audioRef.current = null;
    });

    audioRef.current = el;
    setPlayingId(id);
    void el.play().catch(() => {
      setPlayingId(null);
      setProgressById((m) => ({ ...m, [id]: 0 }));
      el.removeEventListener("timeupdate", onTime);
      audioRef.current = null;
    });
  };

  const toggleAudioPlay = (id: string, src: string) => {
    if (!src) return;
    if (playingId === id) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const el = new Audio(src);
    el.onended = () => setPlayingId(null);
    void el.play().catch(() => setPlayingId(null));
    audioRef.current = el;
    setPlayingId(id);
  };

  // Separate images and other files
  const imageFiles = files.filter(
    (f) =>
      mimeOf(f).startsWith("image/") &&
      (mediaSrc(f) || f.base64) &&
      !(f.progress !== undefined && f.progress < 100)
  );

  const nonImageFiles = files.filter(
    (f) =>
      !(
        mimeOf(f).startsWith("image/") &&
        (mediaSrc(f) || f.base64) &&
        !(f.progress !== undefined && f.progress < 100)
      )
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Render images in grid */}
      {imageFiles.length > 0 && (
        <div
          className={cn(
            "grid gap-2",
            imageFiles.length === 1 ? "grid-cols-1" : "grid-cols-2"
          )}
        >
          {imageFiles.slice(0, 4).map((f, index) => {
            const src = mediaSrc(f);
            const isLastOfFour = index === 3;
            const hasMore = imageFiles.length > 4;
            const isColSpan = imageFiles.length === 3 && index === 2;

            return (
              <div
                key={f.id}
                className={cn(
                  "relative group overflow-visible",
                  imageFiles.length === 1 ? "w-full" : "aspect-square",
                  isColSpan && "col-span-2 aspect-[2/1]"
                )}
              >
                <button
                  type="button"
                  onClick={() => onRemove(f.id)}
                  className="absolute -top-1.5 -right-1.5 z-25 flex size-7 items-center justify-center rounded-full border-2 border-background bg-fill-neutral-weaker text-icon-neutral-strong shadow-sm hover:bg-fill-neutral-weak"
                  aria-label="Remove attachment"
                >
                  <TimesIcon width={8} height={8} />
                </button>
                <img
                  src={src || (f.base64 as string)}
                  alt=""
                  className={cn(
                    "rounded-xl object-cover w-full h-full",
                    imageFiles.length === 1 && "max-h-48"
                  )}
                />
                {isLastOfFour && hasMore && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center pointer-events-none">
                    <span className="font-inter text-white text-base font-bold">
                      +{imageFiles.length - 4} more
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {nonImageFiles.map((f) => {
        const mime = mimeOf(f);
        const isVideo = mime.startsWith("video/");
        const isVoice = !!voiceNoteIds[f.id];
        const isAudio = mime.startsWith("audio/") && !isVoice;
        const src = mediaSrc(f);
        const dur = durationOf(f);

        if (f.progress !== undefined && f.progress < 100) {
          return (
            <div
              key={f.id}
              className="relative flex items-center justify-center rounded-xl border border-dashed border-stroke-neutral-weaker py-8"
            >
              <span className="font-inter text-xs text-text-neutral-weaker">Uploading… {f.progress}%</span>
            </div>
          );
        }

        if (isVideo && src) {
          return (
            <div key={f.id} className="relative">
              <button
                type="button"
                onClick={() => onRemove(f.id)}
                className="absolute -top-1 -right-1 z-10 flex size-7 items-center justify-center rounded-full border-2 border-background bg-fill-neutral-weaker text-icon-neutral-strong shadow-sm hover:bg-fill-neutral-weak"
                aria-label="Remove attachment"
              >
                <TimesIcon width={8} height={8} />
              </button>
              <div className="relative overflow-hidden rounded-xl bg-black">
                <VideoPlayer src={src} />
              </div>
            </div>
          );
        }

        if (isVoice) {
          const title =
            f.file?.name || f.uploadedFile?.name ?
              `Voice note · ${f.file?.name || f.uploadedFile?.name}`
            : `Voice note · ${formatTimestamp(dur)}`;
          const progress = playingId === f.id ? (progressById[f.id] ?? 0) : 0;
          const bars = barHeightsForId(f.id);

          return (
            <div
              key={f.id}
              className="relative overflow-hidden rounded-2xl bg-fill-neutral-strong px-4 pb-3.5 pt-3 shadow-sm"
            >
              <button
                type="button"
                onClick={() => onRemove(f.id)}
                className="absolute top-2.5 right-2.5 z-10 flex size-7 items-center justify-center rounded-full text-inverse-weaker transition-colors hover:bg-white/10 hover:text-inverse-strong"
                aria-label="Remove voice note"
              >
                <TimesIcon width={8} height={8} />
              </button>
              <div className="min-w-0 pr-9">
                <p className="truncate font-inter text-[13px] leading-snug text-inverse-strong">{title}</p>
                <div className="mt-3 flex items-end gap-3">
                  <div className="min-w-0 flex-1 pt-0.5">
                    <VoiceWaveformProgress progress={progress} barHeights={bars} />
                  </div>
                  <button
                    type="button"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-inverse-strong transition-opacity hover:opacity-90"
                    aria-label={playingId === f.id ? "Pause voice note" : "Play voice note"}
                    onClick={() => toggleVoicePlay(f.id, src)}
                  >
                    {playingId === f.id ?
                      <Pause className="size-5 fill-current" />
                    : <Play className="size-5 fill-current pl-0.5" />}
                  </button>
                </div>
              </div>
            </div>
          );
        }

        if (isAudio && src) {
          return (
            <div
              key={f.id}
              className="relative flex items-center gap-3 rounded-xl border border-stroke-neutral-weaker bg-fill-neutral-weaker/30 p-3"
            >
              <button
                type="button"
                onClick={() => onRemove(f.id)}
                className="absolute -top-1 -right-1 z-10 flex size-7 items-center justify-center rounded-full border-2 border-background bg-fill-neutral-weaker text-icon-neutral-strong shadow-sm hover:bg-fill-neutral-weak"
                aria-label="Remove attachment"
              >
                <TimesIcon width={8} height={8} />
              </button>
              <button
                type="button"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm"
                aria-label={playingId === f.id ? "Pause audio" : "Play audio"}
                onClick={() => toggleAudioPlay(f.id, src)}
              >
                {playingId === f.id ? <Pause className="size-4" /> : <Play className="size-4 pl-0.5" />}
              </button>
              <div className="min-w-0 flex-1 pl-1">
                <WaveformBars active={playingId === f.id} />
                <p className="mt-1 truncate font-inter text-xs text-text-neutral-strong">
                  {f.file?.name || f.uploadedFile?.name || "Audio"}
                </p>
              </div>
              <span className="shrink-0 font-inter text-xs tabular-nums text-text-neutral-weak">
                {formatTimestamp(dur)}
              </span>
            </div>
          );
        }

        return (
          <div
            key={f.id}
            className="relative flex items-center gap-2 rounded-xl border border-stroke-neutral-weaker px-3 py-3 pr-10"
          >
            <button
              type="button"
              onClick={() => onRemove(f.id)}
              className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full text-icon-neutral-weak hover:bg-fill-neutral-weaker"
              aria-label="Remove attachment"
            >
              <TimesIcon width={8} height={8} />
            </button>
            <span className="truncate font-inter text-sm text-text-neutral-strong">
              {f.file?.name || f.uploadedFile?.name || "File"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
