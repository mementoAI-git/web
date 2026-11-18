import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VOICE_CALL_LAYER } from "@/components/Chatinput/voice-layers";
import { useFloatingVoicePosition } from "@/hooks/use-floating-voice-position";
import type { VoiceCapturePhase } from "@/hooks/use-voice-capture";
import { cn } from "@/utility";
import { VoiceRecorderSilenceHint, VoiceRecorderWaveform } from "./voice-recorder";

const ROUND_BUTTON =
  "size-12 shrink-0 rounded-full border border-stroke-neutral-weak bg-fill-neutral-weaker p-0 text-icon-neutral-strong shadow-xs hover:bg-fill-neutral-weak hover:text-icon-neutral-strong [&_svg]:size-5";

/** The design's pause: two plain round-capped bars. */
function PauseIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M7 5v14M17 5v14" />
    </svg>
  );
}

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

const STATUS: Partial<Record<VoiceCapturePhase, string>> = {
  starting: "Preparing microphone…",
  saving: "Saving…",
};

/**
 * The recorder as its own floating window, placed and dragged like the floating call.
 * It only shows the capture; whoever owns the recording decides what a finished one becomes.
 */
export function FloatingVoiceRecorder({
  phase,
  seconds,
  levels,
  silent,
  onCancel,
  onDone,
  onTogglePause,
}: {
  phase: VoiceCapturePhase;
  seconds: number;
  levels: number[];
  silent?: boolean;
  onCancel: () => void;
  onDone: () => void;
  onTogglePause: () => void;
}) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const container = useRef<HTMLDivElement | null>(null);
  const [detached] = useState(() => document.createElement("div"));
  const position = useFloatingVoicePosition(host ?? detached, container, Boolean(host));
  const capturing = phase === "recording" || phase === "paused";
  const paused = phase === "paused";
  const busy = !capturing;
  const status = STATUS[phase];

  return createPortal(
    <div
      ref={(element) => {
        container.current = element;
        setHost(element);
      }}
      role="dialog"
      aria-label="New recording"
      data-testid="floating-voice-recorder"
      style={position}
      className={cn(
        VOICE_CALL_LAYER,
        "pointer-events-auto fixed right-4 top-[84px] w-[min(360px,calc(100vw-2rem))] rounded-3xl backdrop-blur-2xl sm:right-8",
      )}
    >
      <section className="relative isolate flex flex-col items-center overflow-hidden rounded-3xl border border-stroke-neutral-weak bg-bg-neutral pb-6 pt-3 text-text-neutral-strong shadow-[0_20px_60px_rgba(0,0,0,0.18),0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.45),0_4px_16px_rgba(0,0,0,0.25)]">
        <button
          type="button"
          data-voice-drag-handle
          aria-label="Move recording window"
          title="Drag to move. Use arrow keys when focused."
          className="absolute inset-0 -z-10 touch-none cursor-grab rounded-[inherit] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stroke-neutral-strong active:cursor-grabbing"
        />
        {/* Text and gaps let drags through to the handle behind them. */}
        <span aria-hidden className="pointer-events-none h-1 w-12 rounded-full bg-stroke-neutral-weak" />
        <h2 className="pointer-events-none mt-5 font-geist text-xl font-semibold leading-7 text-text-neutral-strong">
          New recording
        </h2>
        <p
          role="status"
          className="pointer-events-none mt-1 flex h-6 items-center gap-3 font-geist text-base tabular-nums text-text-neutral-weak"
        >
          {status ? (
            <span className="t-shimmer" data-text={status}>{status}</span>
          ) : (
            <>
              <span
                aria-hidden
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  paused ? "bg-icon-neutral-weak" : "bg-fill-success-strong",
                )}
              />
              <span aria-label={paused ? `Paused at ${formatTime(seconds)}` : `Recording, ${formatTime(seconds)}`}>
                {formatTime(seconds)}
              </span>
            </>
          )}
        </p>
        <div
          className="pointer-events-none mt-6 w-full px-6"
          style={{ maskImage: "linear-gradient(to right, transparent, black 20%)" }}
        >
          <VoiceRecorderWaveform levels={levels} flat={!capturing} className="h-8" />
        </div>
        {capturing && silent ? (
          <div className="mt-2 px-6 text-center">
            <VoiceRecorderSilenceHint silent />
          </div>
        ) : null}
        <div className="mt-6 flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            aria-label="Cancel recording"
            onClick={onCancel}
            className={ROUND_BUTTON}
          >
            <X aria-hidden />
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={onDone}
            className="h-12 w-[157px] gap-2.5 rounded-full border border-stroke-brand-strong/60 font-geist text-base font-semibold [&_svg]:size-5"
          >
            <Check aria-hidden strokeWidth={2.25} /> Done
          </Button>
          <Button
            type="button"
            variant="ghost"
            aria-label={paused ? "Resume recording" : "Pause recording"}
            aria-pressed={paused}
            disabled={busy}
            onClick={onTogglePause}
            className={ROUND_BUTTON}
          >
            {paused ? <Play aria-hidden /> : <PauseIcon />}
          </Button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
