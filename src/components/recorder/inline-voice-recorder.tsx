"use client";

import { Mic, Square } from "lucide-react";
import { cn } from "@/utility";
import { Button } from "@/components/ui/button";

type InlineVoiceRecorderProps = {
  recording: boolean;
  busy?: boolean;
  timerSec: number;
  levels: number[];
  onToggleRecording: () => void;
  title?: string;
  idleLabel?: string;
  recordingLabel?: string;
  className?: string;
  error?: string | null;
  onDismiss?: () => void;
};

function formatTimer(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function InlineVoiceRecorder({
  recording,
  busy = false,
  timerSec,
  levels,
  onToggleRecording,
  title = "Voice note",
  idleLabel = "Tap to start recording",
  recordingLabel = "Recording in progress",
  className,
  error,
  onDismiss,
}: InlineVoiceRecorderProps) {
  const hasActivity = recording || busy || timerSec > 0;

  return (
    <div
      className={cn(
        "rounded-2xl border border-stroke-neutral-weaker bg-fill-neutral-weaker/35 px-3 py-3",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-inter text-xs font-semibold uppercase tracking-wide text-text-neutral-weaker">
            {title}
          </p>
          <p className="font-inter text-sm text-text-neutral-weak">
            {recording ? recordingLabel : idleLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onDismiss ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={recording || busy}
              onClick={onDismiss}
              className="h-9 rounded-full px-2.5 font-inter text-[11px] font-medium text-text-neutral-weak"
            >
              Dismiss
            </Button>
          ) : null}
          <Button
            type="button"
            variant={recording ? "destructive" : "secondary"}
            size="sm"
            disabled={busy}
            onClick={onToggleRecording}
            className={cn("h-9 rounded-full px-3 font-inter text-xs font-semibold")}
            aria-label={recording ? "Stop recording" : "Start recording"}
          >
            {recording ? <Square className="mr-1.5 size-3.5 fill-current" /> : <Mic className="mr-1.5 size-3.5" />}
            {recording ? "Stop" : busy ? "Saving..." : "Record"}
          </Button>
        </div>
      </div>

      {hasActivity ? (
        <div className="mt-3 rounded-xl border border-stroke-neutral-weaker bg-background/80 px-3 py-3">
          <div className="flex h-12 items-end justify-center gap-0.5">
            {levels.map((height, index) => (
              <span
                key={index}
                className={cn(
                  "w-1 rounded-full transition-[height,opacity] duration-150",
                  recording ? "bg-fill-brand-strong/85 opacity-100" : "bg-fill-brand-strong/45 opacity-70",
                )}
                style={{ height: `${Math.max(4, height)}px` }}
                aria-hidden
              />
            ))}
          </div>
          <p className="mt-2 text-center font-inter text-sm tabular-nums text-text-neutral-strong">
            {formatTimer(timerSec)}
          </p>
        </div>
      ) : null}

      {error ? <p className="mt-2 font-inter text-xs text-danger">{error}</p> : null}
    </div>
  );
}
