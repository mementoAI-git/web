"use client";

import { useRef, useState } from "react";
import { useModal } from "@/hooks/use-modal";
import { TimesIcon } from "@/components/icons";
import { VideoRecorder } from "@/components/recorder";
import useRecorder from "@/hooks/use-recorder";
import { toast } from "sonner";
import Spinner from "@/components/spinner";

function formatTimer(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

interface RecorderModalProps {
  data: {
    onFinish: (file: File) => void;
    recordingNumber?: number;
  };
}

export function AudioRecorderModal({ data }: RecorderModalProps) {
  const { close } = useModal();
  const recordingNumber = data.recordingNumber ?? 1;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const rec = useRecorder(stream, "audio/webm");

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
    if (rec.url) {
      fetch(rec.url)
        .then((r) => r.blob())
        .then((blob) => {
          const file = new File([blob], `recording-${recordingNumber}.webm`, { type: "audio/webm" });
          data.onFinish(file);
          close("audio-recorder");
        });
    } else if (rec.chunks.length > 0) {
      const blob = new Blob(rec.chunks, { type: "audio/webm" });
      const file = new File([blob], `recording-${recordingNumber}.webm`, { type: "audio/webm" });
      rec.stop();
      data.onFinish(file);
      close("audio-recorder");
    }
  };

  const handleClose = () => {
    handleReset();
    close("audio-recorder");
  };

  const isIdle = rec.timer === 0 && !rec.url;
  const isRecording = rec.recording;
  const isPaused = !rec.recording && rec.timer > 0 && !rec.url;
  const isDone = !!rec.url;

  const barHeights = [6, 12, 18, 10, 22, 14, 20, 8, 16, 12, 24, 10, 15];
  const barColor = isRecording ? "#7C3AED" : isPaused ? "#F97316" : isDone ? "#22C55E" : "#D1D5DB";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-[28px] w-full max-w-[380px] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 0L7.2 4H11L8 6.5L9.2 10.5L6 8L2.8 10.5L4 6.5L1 4H4.8L6 0Z" fill="#7C3AED" />
            </svg>
            <span className="font-inter text-xs font-bold text-purple-600 tracking-widest uppercase">Record Audio</span>
          </div>
          <button
            onClick={handleClose}
            className="size-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <TimesIcon width={10} height={10} />
          </button>
        </div>

        {/* Waveform card */}
        <div className="mx-6 mt-4 mb-5 bg-gray-50 rounded-2xl px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-inter text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              New Recording #{String(recordingNumber).padStart(2, "0")}
            </span>
            <span className="font-mono text-[11px] text-gray-400">{formatTimer(rec.timer)}</span>
          </div>
          <div className="flex items-end justify-center gap-1 h-10">
            {barHeights.map((h, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full transition-colors duration-300"
                style={{ height: h, backgroundColor: barColor }}
              />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 pb-7">
          {/* Idle */}
          {isIdle && (
            <div className="flex flex-col items-center gap-4">
              <p className="font-inter text-xs font-semibold text-gray-400 tracking-widest uppercase">Click to record</p>
              <button
                onClick={handleStart}
                className="w-full h-12 rounded-full bg-[#170B00] text-white font-inter font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Start talking
              </button>
            </div>
          )}

          {/* Recording */}
          {isRecording && (
            <div className="flex flex-col items-center gap-5">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-inter text-sm font-bold text-red-500 tracking-widest uppercase">Recording</span>
              </div>
              <div className="flex items-center justify-center gap-12">
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={rec.pause}
                    className="size-14 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                  >
                    <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
                      <rect x="0" y="0" width="4.5" height="18" rx="2" fill="#374151" />
                      <rect x="9.5" y="0" width="4.5" height="18" rx="2" fill="#374151" />
                    </svg>
                  </button>
                  <span className="font-inter text-xs text-gray-500">Pause</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => rec.stop()}
                    className="size-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="2" width="12" height="12" rx="3" fill="white" />
                    </svg>
                  </button>
                  <span className="font-inter text-xs text-gray-500">Stop</span>
                </div>
              </div>
            </div>
          )}

          {/* Paused or Done */}
          {(isPaused || isDone) && (
            <div className="flex flex-col items-center gap-4">
              {isPaused && (
                <div className="flex items-center gap-2">
                  <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                    <rect x="0" y="0" width="4" height="14" rx="2" fill="#EF4444" />
                    <rect x="8" y="0" width="4" height="14" rx="2" fill="#EF4444" />
                  </svg>
                  <span className="font-inter text-sm font-bold text-red-500 tracking-widest uppercase">Paused</span>
                </div>
              )}
              {isDone && (
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-green-500" />
                  <span className="font-inter text-sm font-semibold text-green-600">Recording ready</span>
                </div>
              )}
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={handleReset}
                  className="flex-1 h-10 rounded-full bg-gray-100 text-gray-600 font-inter font-semibold text-sm hover:bg-gray-200 transition-colors"
                >
                  Reset
                </button>
                {isPaused && (
                  <button
                    onClick={rec.resume}
                    className="flex-1 h-10 rounded-full bg-orange-100 text-orange-600 font-inter font-semibold text-sm hover:bg-orange-200 transition-colors"
                  >
                    Resume
                  </button>
                )}
                <button
                  onClick={handleAddToPost}
                  className="flex-1 h-10 rounded-full bg-[#170B00] text-white font-inter font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Add to post
                </button>
              </div>
            </div>
          )}
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
  const videoRef = useRef<any>(null);
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
              className="h-10 px-5 rounded-full font-inter font-semibold text-sm text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-opacity"
              style={{ backgroundColor: "#FF5E00" }}
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
