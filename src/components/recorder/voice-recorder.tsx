import { useEffect, useRef, type ComponentProps } from "react";
import { LoaderIcon, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import cancelIcon from "@/assets/icon/overview-recording/cancel-light.svg";
import dotIcon from "@/assets/icon/overview-recording/dot-light.svg";
import stopIcon from "@/assets/icon/overview-recording/stop-light.svg";
import { Button } from "@/components/ui/button";
import { useVoiceCapture, type VoiceCapturePhase } from "@/hooks/use-voice-capture";
import { cn } from "@/utility";

const ROUND_BUTTON =
  "size-10 shrink-0 rounded-full border-stroke-neutral-strong bg-transparent p-[9px] text-icon-neutral-weak";

export function VoiceRecorderIcon({
  src,
  brand = false,
}: {
  src: string;
  brand?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-5 shrink-0 bg-current",
        brand && "text-icon-brand-strong",
      )}
      style={{
        maskImage: `url("${src}")`,
        maskSize: "20px 20px",
        maskRepeat: "no-repeat",
        maskPosition: "center",
      }}
    />
  );
}

export function VoiceRecorderWaveform({
  levels,
  flat = false,
  maxHeight = 32,
  className,
}: {
  levels: number[];
  flat?: boolean;
  maxHeight?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex h-10 min-w-0 flex-1 items-center justify-end gap-1 overflow-hidden",
        className,
      )}
    >
      {levels.map((height, index) => (
        <span
          key={index}
          className="w-1 shrink-0 rounded-lg bg-icon-neutral-weak"
          style={{ height: flat ? 5 : Math.min(maxHeight, height) }}
        />
      ))}
    </div>
  );
}

function formatRecorderTime(seconds: number) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}s`;
}

const STATUS_LABEL: Record<VoiceCapturePhase, string> = {
  idle: "",
  starting: "Preparing microphone…",
  recording: "Recording…",
  paused: "Paused…",
  transcribing: "Transcribing…",
  saving: "Saving…",
};

export function VoiceRecorderStatus({
  phase,
  seconds,
  className,
  ...props
}: {
  phase: VoiceCapturePhase;
  seconds: number;
} & Omit<ComponentProps<"div">, "children">) {
  const capturing = phase === "recording" || phase === "paused";
  const transcribing = phase === "transcribing";
  const label = STATUS_LABEL[phase];
  return (
    <div
      role="status"
      aria-label={transcribing ? "Transcribing" : undefined}
      className={cn(
        "flex flex-wrap items-center",
        transcribing ? "gap-2" : "gap-4",
        className,
      )}
      {...props}
    >
      {transcribing && (
        <LoaderIcon
          aria-hidden
          className="size-4 animate-spin text-icon-neutral-weak"
        />
      )}
      <span className="font-garamond text-2xl italic leading-[34px] text-text-neutral-strong">
        <span className={capturing ? undefined : "t-shimmer"} data-text={label}>
          {label}
        </span>
      </span>
      {capturing && (
        <span className="flex items-center gap-2 font-geist text-sm tabular-nums text-text-neutral-weak">
          <img src={dotIcon} alt="" />
          {formatRecorderTime(seconds)}
        </span>
      )}
    </div>
  );
}

/** Says so when nothing is coming in, rather than leaving a flat waveform to explain itself. */
export function VoiceRecorderSilenceHint({ silent }: { silent?: boolean }) {
  if (!silent) return null;
  return (
    <p role="status" className="font-inter text-xs text-text-neutral-weak">
      No sound detected. Check that the right microphone is selected and isn’t muted.
    </p>
  );
}

export function VoiceRecorderCancelButton({
  onCancel,
  className,
}: {
  onCancel: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Cancel recording"
      onClick={onCancel}
      className={cn(ROUND_BUTTON, className)}
    >
      <VoiceRecorderIcon src={cancelIcon} />
    </Button>
  );
}

export function VoiceRecorderControls({
  phase,
  levels,
  onCancel,
  onStop,
  onTogglePause,
  stopLabel = "Stop recording",
  className,
  ...props
}: {
  phase: VoiceCapturePhase;
  levels: number[];
  onCancel: () => void;
  onStop: () => void;
  /** Leave out on surfaces that don't offer pausing. */
  onTogglePause?: () => void;
  stopLabel?: string;
} & Omit<ComponentProps<"div">, "children">) {
  const busy =
    phase === "starting" || phase === "transcribing" || phase === "saving";
  const paused = phase === "paused";
  return (
    <div className={cn("flex h-10 items-center", className)} {...props}>
      <VoiceRecorderCancelButton onCancel={onCancel} />
      <VoiceRecorderWaveform
        levels={levels}
        flat={phase === "starting"}
        className="px-3"
      />
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={stopLabel}
          disabled={busy}
          onClick={onStop}
          className={ROUND_BUTTON}
        >
          <VoiceRecorderIcon src={stopIcon} brand />
        </Button>
        {onTogglePause && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={paused ? "Resume recording" : "Pause recording"}
            aria-pressed={paused}
            disabled={busy}
            onClick={onTogglePause}
            className={ROUND_BUTTON}
          >
            {paused ? (
              <Play aria-hidden className="size-5" />
            ) : (
              <Pause aria-hidden className="size-5" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

type VoiceCapture = ReturnType<typeof useVoiceCapture>;

/**
 * The recording panel, matching the mobile StoryRecordingPanel: its own panel above a
 * composer's toolbar, never replacing it. Each recorder below owns its capture state so
 * the waveform doesn't re-render the composer on every tick.
 */
function RecorderPanel({
  recording,
  onClose,
  stopLabel,
  testId,
  keepOpenOnRetryableError = false,
  className,
}: {
  recording: VoiceCapture;
  onClose: () => void;
  stopLabel: string;
  testId: string;
  /** Holds the panel open when the capture can be retried, so nothing said is lost. */
  keepOpenOnRetryableError?: boolean;
  className?: string;
}) {
  const latest = useRef({ recording, onClose });
  latest.current = { recording, onClose };
  const retryable = keepOpenOnRetryableError && recording.canRetry;

  useEffect(() => {
    void latest.current.recording.start();
  }, []);

  useEffect(() => {
    if (!recording.error || retryable) return;
    toast.error(recording.error);
    latest.current.onClose();
  }, [recording.error, retryable]);

  // Escape discards the recording, not the composer around it. Listening on
  // window in the capture phase runs ahead of the dialog's own Escape handler.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      latest.current.recording.cancel();
      latest.current.onClose();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  const discard = () => {
    recording.cancel();
    onClose();
  };
  const capturing = recording.phase === "recording" || recording.phase === "paused";
  return (
    <div
      data-testid={testId}
      className={cn(
        "mb-3 flex w-full min-w-0 flex-col gap-3 rounded-[14px] border border-stroke-neutral-weak bg-fill-neutral-weak p-3",
        className,
      )}
    >
      {retryable && recording.phase === "idle" ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p role="alert" className="min-w-0 font-inter text-sm text-text-neutral-strong">
            {recording.error}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={discard}>
              Discard
            </Button>
            <Button type="button" size="sm" onClick={() => void recording.retry()}>
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <>
          <VoiceRecorderStatus phase={recording.phase} seconds={recording.seconds} className={capturing ? "gap-2.5" : undefined} />
          <VoiceRecorderSilenceHint silent={recording.silent} />
          <div className="flex items-center gap-3">
            <VoiceRecorderCancelButton onCancel={discard} className="size-11" />
            <VoiceRecorderWaveform
              levels={recording.levels.slice(-32)}
              flat={recording.phase === "starting"}
              className="h-8 justify-between gap-0"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={stopLabel}
              disabled={recording.phase !== "recording"}
              onClick={recording.stop}
              className={cn(ROUND_BUTTON, "size-11")}
            >
              <VoiceRecorderIcon src={stopIcon} brand />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/** Records as soon as it mounts and hands back an audio file. */
export function AudioAttachmentRecorder({
  onFinish,
  onClose,
  className,
}: {
  onFinish: (file: File, durationSeconds: number) => void;
  onClose: () => void;
  className?: string;
}) {
  const recording = useVoiceCapture({
    mode: "audio",
    onAudio: (file, durationSeconds) => {
      onFinish(file, durationSeconds);
      onClose();
    },
  });
  return (
    <RecorderPanel
      recording={recording}
      onClose={onClose}
      stopLabel="Stop recording"
      testId="audio-attachment-recorder"
      className={className}
    />
  );
}

/** Records as soon as it mounts and hands back what was said; the audio isn't kept. */
export function DictationRecorder({
  onTranscript,
  onClose,
  className,
}: {
  onTranscript: (text: string) => void;
  onClose: () => void;
  className?: string;
}) {
  const recording = useVoiceCapture({
    mode: "text",
    onTranscript: (text) => {
      onTranscript(text);
      onClose();
    },
  });
  return (
    <RecorderPanel
      recording={recording}
      onClose={onClose}
      stopLabel="Stop recording and transcribe"
      testId="dictation-recorder"
      keepOpenOnRetryableError
      className={className}
    />
  );
}
