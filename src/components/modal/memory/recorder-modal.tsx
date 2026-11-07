"use client";

import { useRef, useState, type ComponentRef } from "react";
import { useModal } from "@/hooks/use-modal";
import { TimesIcon } from "@/components/icons";
import { VideoRecorder } from "@/components/recorder";
import Spinner from "@/components/spinner";

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
    <div className="bg-bg-neutral rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-stroke-neutral-weak">
        <h3 className="font-garamond text-xl font-medium text-text-neutral-strong">Record Video</h3>
        <button
          type="button"
          onClick={() => close("video-recorder")}
          className="size-8 flex items-center justify-center rounded-full bg-bg-neutral-weaker hover:bg-fill-neutral-weak transition-colors"
        >
          <TimesIcon width={10} height={10} />
        </button>
      </div>

      <div className="p-4">
        <VideoRecorder ref={videoRef} onStart={() => {}} onFinish={handleFinish} />

        {recordedFile && (
          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-stroke-neutral-weak">
            <button
              type="button"
              onClick={handleReRecord}
              className="h-10 px-5 rounded-full font-inter font-semibold text-sm text-text-neutral-weak border border-gray-200 hover:bg-gray-50 transition-colors"
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
