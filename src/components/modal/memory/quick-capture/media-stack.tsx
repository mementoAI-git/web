"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { TimesIcon } from "@/components/icons";
import VideoPlayer from "@/components/player/video-player";
import type { IOnUploadPayload } from "@/utility/interface";
import { cn } from "@/utility";
import { inferMimeType } from "@/utility/constant";
import { displayFileName, voiceNoteLabel } from "@/utility/file-label";
import { VoiceNoteTile } from "@/components/recorder/voice-note-tile";
import { useModal } from "@/hooks/use-modal";


function formatTimestamp(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function mimeOf(f: IOnUploadPayload): string {
  return (
    f.file?.type ||
    f.uploadedFile?.type ||
    inferMimeType(f.file?.name ?? f.uploadedFile?.name ?? "")
  );
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
  if (f.base64 && String(f.base64).startsWith("data:"))
    return f.base64 as string;
  if (typeof f.uploadedFile?.url === "string" && f.uploadedFile.url)
    return f.uploadedFile.url;
  return "";
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

export function QuickCaptureMediaStack({
  files,
  voiceNoteIds,
  onRemove,
}: {
  files: IOnUploadPayload[];
  voiceNoteIds: Record<string, true>;
  onRemove: (id: string) => void;
}) {
  const { push } = useModal();
  const [expanded, setExpanded] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

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

  const visualFiles = files.filter(
    (f) =>
      /^(image|video)\//.test(mimeOf(f)) && mediaSrc(f) && f.progress === 100,
  );
  const nonImageFiles = files.filter((f) => !visualFiles.includes(f));
  const visibleFiles = expanded ? visualFiles : visualFiles.slice(0, 5);

  return (
    <div className="flex flex-col gap-3">
      {visualFiles.length > 0 && (
        <div
          className={cn(
            "grid gap-1",
            visualFiles.length === 1
              ? "grid-cols-1"
              : visualFiles.length < 4 || expanded
                ? "grid-cols-2"
                : "h-[175px] grid-cols-[1.6fr_1fr_1fr] grid-rows-2",
          )}
        >
          {visibleFiles.map((f, index) => (
            <div
              key={f.id}
              className={cn(
                "group relative min-h-0 min-w-0",
                visualFiles.length >= 4 &&
                  !expanded &&
                  index === 0 &&
                  "row-span-2",
                (visualFiles.length < 4 || expanded) && "h-40",
              )}
            >
              <button
                type="button"
                onClick={() => onRemove(f.id)}
                className="absolute right-1 top-1 z-10 flex size-6 items-center justify-center rounded-full border border-stroke-neutral-weak bg-bg-neutral text-icon-neutral-strong opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 max-md:opacity-100"
                aria-label="Remove attachment"
              >
                <TimesIcon width={8} height={8} />
              </button>
              {mimeOf(f).startsWith("video/") ? (
                <video
                  src={mediaSrc(f)}
                  controls
                  playsInline
                  preload="metadata"
                  className="size-full rounded-xl bg-fill-neutral-strong object-cover"
                />
              ) : (
                <img
                  src={mediaSrc(f)}
                  alt={f.file?.name || f.uploadedFile?.name || "Attached image"}
                  className="size-full rounded-xl object-cover"
                />
              )}
              {!expanded && index === 4 && visualFiles.length > 5 && (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="absolute inset-0 flex items-center justify-center rounded-xl bg-overlay-backdrop text-base font-medium text-text-inverse-strong"
                >
                  +{visualFiles.length - 5} more
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {expanded && (
        <button
          type="button"
          className="self-start text-xs text-text-neutral-weak underline"
          onClick={() => setExpanded(false)}
        >
          Show fewer attachments
        </button>
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
              <span className="font-inter text-xs text-text-neutral-weaker">
                Uploading… {f.progress}%
              </span>
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
              <div className="relative overflow-hidden rounded-xl bg-fill-neutral-strong">
                <VideoPlayer src={src} />
              </div>
            </div>
          );
        }

        if (isVoice) {
          const uploaded = f.uploadedFile;
          return (
            <VoiceNoteTile
              key={f.id}
              id={uploaded?._id || f.id}
              src={src}
              duration={dur}
              label={voiceNoteLabel(f.file?.name || uploaded?.name) ?? "Voice note"}
              onRemove={() => onRemove(f.id)}
              onOpen={uploaded?._id ? () => push?.("file-preview", { files: [{ ...uploaded, duration: dur }], readOnly: true }) : undefined}
            />
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
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-fill-neutral-weak text-icon-neutral-strong shadow-sm hover:bg-fill-neutral-weaker"
                aria-label={playingId === f.id ? "Pause audio" : "Play audio"}
                onClick={() => toggleAudioPlay(f.id, src)}
              >
                {playingId === f.id ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4 pl-0.5" />
                )}
              </button>
              <div className="min-w-0 flex-1 pl-1">
                <WaveformBars active={playingId === f.id} />
                <p className="mt-1 truncate font-inter text-xs text-text-neutral-strong">
                  {displayFileName(f.file?.name || f.uploadedFile?.name) || "Audio"}
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
