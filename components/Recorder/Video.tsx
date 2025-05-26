"use client";

import VideoIcon from "@/public/icon/video.svg";
import RecIndicator from "@/components/RecIndicator";
import AletHexagonIcon from "@/public/icon/alert-hexagon.svg";
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import useRecorder from "@/hooks/use-recorder";
import { VideoRecButtons } from "./RecButtons";
import AudioVisualizer from "@/components/AudioVisualizer";
import { toast } from "sonner";
import VideoPlayer from "@/components/Player/VideoPlayer";
import { IRecorder } from "./interface";

const constraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: true,
};

const fileType = "video/webm";

export const VideoRecorder = forwardRef(function ({ onStart, onFinish }: IRecorder, ref) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recorder = useRecorder(stream, fileType);

  const start = useCallback(() => {
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        if (stream) {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setStream(stream);
          setTimeout(recorder.start, 2000);
          onStart(stream)
        }
      })
      .catch(() => {
        toast.error("Camera access denied or not available.", {
          className: "!text-danger",
        });
      });
  }, [onStart]);

  const stop = () => {
    recorder.stop()
    if (recorder.chunks) {
      const blob = new Blob(recorder.chunks, { type: fileType });
      const file = new File([blob], "recorded.webm", { type: fileType });

      onFinish(file)
    }
  }

  useImperativeHandle(ref, () => ({ ...recorder, start, stop }));
  return (
    <div>
      <div className="flex items-center justify-center rounded-t-2xl bg-grey-400 py-1 text-grey-800">
        <div className="flex items-center gap-1">
          <AletHexagonIcon width={16} height={16} />
          <span className="font-inter text-xs">
            Max video recording length is 4 minutes
          </span>
        </div>
      </div>

      <div className="relative flex min-h-100 w-full items-center justify-center overflow-hidden rounded-b-2xl border border-t-0 border-grey-400">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute  top-0 right-0 z-0 size-full`}
        />
        {recorder.url ? (
          <div className="absolute top-0 right-0 z-50 size-full">
            <VideoPlayer src={recorder.url} />
          </div>
        ) : stream ? (
          <div className="absolute top-0 right-0 bottom-0 left-0 z-10 flex flex-col justify-between bg-transparent p-3">
            <div className="flex items-center justify-between">
              <div>
                <RecIndicator
                  counter={recorder.timer}
                  recoding={recorder.recording}
                  className="!bg-white/[22%] !text-white"
                />
              </div>
              <div className="flex aspect-square w-8 items-center justify-center rounded-full bg-white/[22%]">
                <svg
                  width="15"
                  height="10"
                  viewBox="0 0 15 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.5 1V9M4.5 3V7M1.5 4V6M10.5 3V7M13.5 4V6"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <VideoRecButtons {...{ ...recorder, start, stop }} />
          </div>
        ) : (
          <div className="z-10 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <RecIndicator
                counter={recorder.timer}
                recoding={recorder.recording}
              />
              <AudioVisualizer recorder={recorder.recorder} />
            </div>
            <button
              onClick={start}
              className="btn flex flex-1 items-center justify-center gap-2"
            >
              <VideoIcon width={20} />
              <span className="font-inter text-sm font-semibold">Start</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
})
