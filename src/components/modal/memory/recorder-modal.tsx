"use client";

import { useRef, useState } from "react";
import { useModal } from "@/hooks/use-modal";
import { TimesIcon } from "@/components/icons";
import { AudioRecorder, VideoRecorder } from "@/components/recorder";
import Spinner from "@/components/spinner";

interface RecorderModalProps {
  data: {
    onFinish: (file: File) => void;
  };
}

export function AudioRecorderModal({ data }: RecorderModalProps) {
  const { close } = useModal();
  const audioRef = useRef<any>(null);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [isUsing, setIsUsing] = useState(false);

  const handleFinish = (file: File) => {
    setRecordedFile(file);
  };

  const handleUse = async () => {
    if (!recordedFile) return;
    setIsUsing(true);
    data.onFinish(recordedFile);
    close("audio-recorder");
  };

  const handleReRecord = () => {
    setRecordedFile(null);
    if (audioRef.current?.reset) audioRef.current.reset();
  };

  return (
    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="font-garamond text-xl font-medium text-gray-900">Record Audio</h3>
        <button
          type="button"
          onClick={() => close("audio-recorder")}
          className="size-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <TimesIcon width={10} height={10} />
        </button>
      </div>

      <div className="p-4">
        <AudioRecorder ref={audioRef} onStart={() => {}} onFinish={handleFinish} />

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

export function VideoRecorderModal({ data }: RecorderModalProps) {
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
