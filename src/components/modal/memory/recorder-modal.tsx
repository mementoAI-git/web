"use client";

import { useEffect, useRef, useState, type ComponentRef } from "react";
import { useModal } from "@/hooks/use-modal";
import { MicIcon, TimesIcon, RefreshIcon, PlanePaperIcon, PauseRecIcon, PlayIcon } from "@/components/icons";
import { useAudioLevels } from "@/hooks/use-audio-levels";
import { VideoRecorder } from "@/components/recorder";
import useRecorder from "@/hooks/use-recorder";
import { toast } from "sonner";
import Spinner from "@/components/spinner";

function formatTimer(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

const WAVEFORM_BAR_COUNT = 24;
const WAVEFORM_BAR_HEIGHTS = [16, 28, 40, 24, 36, 44, 32, 20, 48, 28, 36, 24, 40, 32, 44, 20, 28, 36, 40, 24, 32, 44, 28, 36];
const BARS_PER_SECOND = 7;
const MIN_BAR_HEIGHT_PX = 8;

interface RecorderModalProps {
  data: {
    onFinish: (file: File, duration?: number) => void;
    recordingNumber?: number;
  };
}

export function AudioRecorderModal({ data }: RecorderModalProps) {
  const { close } = useModal();
  const recordingNumber = data.recordingNumber ?? 1;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const rec = useRecorder(stream, "audio/webm");
  const audioLevels = useAudioLevels(stream, !!rec.recording);
  const [smoothProgress, setSmoothProgress] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [capturedDuration, setCapturedDuration] = useState(0);
  const lastSecondAtRef = useRef(0);

  // Sub-second progress when recording so bars and line move smoothly
  useEffect(() => {
    if (!rec.recording) {
      setSmoothProgress((rec.timer || 0) * BARS_PER_SECOND);
      return;
    }
    lastSecondAtRef.current = performance.now();
    const tick = () => {
      const elapsed = (performance.now() - lastSecondAtRef.current) / 1000;
      const progress = (rec.timer || 0) + Math.min(elapsed, 1);
      setSmoothProgress(progress * BARS_PER_SECOND);
    };
    const id = setInterval(tick, 50);
    return () => clearInterval(id);
  }, [rec.recording, rec.timer]);

  useEffect(() => {
    if (rec.recording && rec.timer !== undefined) {
      lastSecondAtRef.current = performance.now();
    }
  }, [rec.recording, rec.timer]);

  const handleStart = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((mediaStream) => {
        setStream(mediaStream);
        setTimeout(() => rec.start(), 500);
      })
      .catch(() => toast.error("Mic access denied or not available."));
  };

  const handleReset = () => {
    rec.reset();
    setStream(null);
  };

  const handleAddToPost = () => {
    const duration = rec.timer;
    setCapturedDuration(duration);
    if (rec.url) {
      setIsSending(true);
    } else {
      setIsSending(true);
      rec.stop();
    }
  };

  useEffect(() => {
    if (isSending && rec.url) {
      fetch(rec.url)
        .then((r) => r.blob())
        .then((blob) => {
          const file = new File([blob], `recording-${recordingNumber}.webm`, { type: "audio/webm" });
          data.onFinish(file, capturedDuration);
          close("audio-recorder");
        });
    }
  }, [isSending, rec.url, recordingNumber, data, close, capturedDuration]);

  const handleClose = () => {
    handleReset();
    close("audio-recorder");
  };

  const isIdle = rec.timer === 0 && !rec.url;
  const isRecording = rec.recording;
  const isPaused = !rec.recording && rec.timer > 0 && !rec.url;
  const isDone = !!rec.url;

  // When recording, loop so the waveform keeps animating; when paused/stopped, show final position (capped at 24)
  const progress =
    rec.recording && smoothProgress >= WAVEFORM_BAR_COUNT
      ? smoothProgress % WAVEFORM_BAR_COUNT
      : Math.min(WAVEFORM_BAR_COUNT, Math.max(0, smoothProgress));

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative w-full max-w-[400px] overflow-hidden rounded-3xl border border-stroke-neutral-weak bg-v3-bg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="relative overflow-hidden rounded-3xl bg-v3-bg">
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full bg-fill-neutral-weaker text-icon-neutral-weak transition-colors hover:bg-fill-neutral-weak"
            aria-label="Close"
          >
            <TimesIcon width={10} height={10} />
          </button>

          <div className="flex flex-col items-center px-8 pb-6 pt-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-stroke-neutral-weaker bg-fill-neutral-weaker/70 px-3 py-1">
              <span className="size-2 rounded-full bg-fill-brand-strong" aria-hidden />
              <p className="font-inter text-[11px] font-semibold uppercase tracking-[0.08em] text-text-neutral-weak">
                Voice recorder
              </p>
            </div>
            {/* Main control: Mic (start) / Pause / Play (continue) */}
            <button
              type="button"
              onClick={
                isIdle
                  ? handleStart
                  : isRecording
                    ? rec.pause
                    : isPaused
                      ? rec.resume
                      : undefined
              }
              disabled={isDone}
              className="mb-1 flex size-20 items-center justify-center rounded-full border border-stroke-neutral-weak bg-fill-neutral-weaker text-icon-neutral-strong transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-100"
              aria-label={
                isIdle
                  ? "Start recording"
                  : isRecording
                    ? "Pause"
                    : isPaused
                      ? "Continue recording"
                      : "Recording"
              }
            >
              {isIdle && <MicIcon className="size-9 shrink-0 text-icon-neutral-strong" />}
              {isRecording && <PauseRecIcon className="size-9 shrink-0 text-icon-neutral-strong" />}
              {isPaused && <PlayIcon className="size-9 shrink-0 text-icon-neutral-strong" />}
              {isDone && <MicIcon className="size-9 shrink-0 text-icon-neutral-weak" />}
            </button>
            <p className="mb-4 font-inter text-xs text-text-neutral-weak" aria-live="polite">
              {isIdle && "Tap to start recording"}
              {isRecording && "Tap to pause"}
              {isPaused && "Tap to continue"}
              {isDone && "Recording ready"}
            </p>

            {/* Timer */}
            <span className="mb-5 font-mono text-lg tabular-nums text-text-neutral-strong">
              {formatTimer(rec.timer)}
            </span>

            {/* Waveform: bars in brand orange; animate with voice when recording, else show progress */}
            <div className="flex justify-center w-full mb-6">
              <div className="relative flex items-center gap-0.5 h-20 w-fit">
                {Array.from({ length: WAVEFORM_BAR_COUNT }).map((_, i) => {
                  if (rec.recording) {
                    const heightPx = audioLevels[i];
                    const isFilled = heightPx > MIN_BAR_HEIGHT_PX;
                    if (!isFilled) {
                      return (
                        <div key={i} className="size-1 shrink-0 self-center rounded-full bg-fill-brand-strong/30 transition-all duration-75 ease-out" aria-hidden />
                      );
                    }
                    return (
                      <div
                        key={i}
                        className="w-1 rounded-sm bg-fill-brand-strong transition-all duration-75 ease-out"
                        style={{ height: `${heightPx}px` }}
                        aria-hidden
                      />
                    );
                  }
                  const fill = Math.min(1, Math.max(0, progress - i));
                  const heightPx =
                    MIN_BAR_HEIGHT_PX +
                    (WAVEFORM_BAR_HEIGHTS[i] - MIN_BAR_HEIGHT_PX) * fill;
                  if (fill <= 0) {
                    return (
                      <div
                        key={i}
                        className="size-1 shrink-0 self-center rounded-full bg-fill-brand-strong/30 transition-all duration-75 ease-out"
                        aria-hidden
                      />
                    );
                  }
                  return (
                    <div
                      key={i}
                      className="w-1 rounded-sm bg-fill-brand-strong transition-all duration-75 ease-out"
                      style={{ height: `${heightPx}px` }}
                      aria-hidden
                    />
                  );
                })}
              </div>
            </div>

            {/* Undo and Send – only when paused or stopped */}
            {(isPaused || isDone) && (
              <div className="flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex size-12 items-center justify-center rounded-full border border-stroke-neutral-weak bg-fill-neutral-weaker text-icon-neutral-strong transition-colors hover:bg-fill-neutral-weak"
                  aria-label="Undo / Re-record"
                >
                  <RefreshIcon className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={handleAddToPost}
                  className="flex size-12 items-center justify-center rounded-full bg-fill-brand-strong text-primary-foreground transition-opacity hover:opacity-90"
                  aria-label="Send"
                >
                  <PlanePaperIcon className="size-5" />
                </button>
              </div>
            )}
            <p className="mt-5 text-center font-inter text-[11px] text-text-neutral-weaker">
              Audio stays private until you add it to your memory.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── VideoRecorderModal (unchanged) ────────────────────────────────────────────

interface VideoRecorderModalProps {
  data: {
    onFinish: (file: File) => void;
  };
}

export function VideoRecorderModal({ data }: VideoRecorderModalProps) {
  const { close } = useModal();
  const videoRef = useRef<ComponentRef<typeof VideoRecorder>>(null);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [isUsing, setIsUsing] = useState(false);

  const handleFinish = (file: File) => {
    setRecordedFile(file);
  };

  const handleUse = async () => {
    if (!recordedFile) return;
    setIsUsing(true);
    data.onFinish(recordedFile);
    close("video-recorder");
  };

  const handleReRecord = () => {
    setRecordedFile(null);
    if (videoRef.current?.reset) videoRef.current.reset();
    if (videoRef.current?.resetStream) videoRef.current.resetStream();
  };

  return (
    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="font-garamond text-xl font-medium text-gray-900">Record Video</h3>
        <button
          type="button"
          onClick={() => close("video-recorder")}
          className="size-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <TimesIcon width={10} height={10} />
        </button>
      </div>

      <div className="p-4">
        <VideoRecorder ref={videoRef} onStart={() => {}} onFinish={handleFinish} />

        {recordedFile && (
          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleReRecord}
              className="h-10 px-5 rounded-full font-inter font-semibold text-sm text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Re-record
            </button>
            <button
              type="button"
              onClick={handleUse}
              disabled={isUsing}
              className="flex h-10 items-center gap-2 rounded-full bg-v3-brand-strong px-5 font-inter text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Use recording
              <Spinner loading={isUsing} className="size-4!" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
