"use client";

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { toast } from "sonner";
import AudioVisualizer from "@/components/audio-visualizer";
import RecIndicator from "@/components/rec-indicator";
import VideoPlayer from "@/components/player/video-player";
import { AlertHexagonIcon, VideoIcon } from "@/components/icons";
import useRecorder from "@/hooks/use-recorder";
import type { RecorderProps } from "./interface";
import { VideoRecButtons } from "./rec-buttons";

const constraints: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: true,
};

const fileType = "video/webm";

export const VideoRecorder = forwardRef<
  ReturnType<typeof useRecorder> & { start: () => void; stop: () => void; resetStream: () => void },
  RecorderProps
>(function VideoRecorderComponent({ onStart, onFinish }, ref) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recorder = useRecorder(stream, fileType);

  const start = useCallback(() => {
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((mediaStream) => {
        if (mediaStream) {
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
          setStream(mediaStream);
          setTimeout(recorder.start, 2000);
          onStart(mediaStream);
        }
      })
      .catch(() => {
        toast.error("Camera access denied or not available.", {
          className: "text-danger!",
        });
      });
  }, [onStart, recorder.start]);

  const stop = () => {
    recorder.stop();
    if (recorder.chunks && recorder.chunks.length > 0) {
      const blob = new Blob(recorder.chunks, { type: fileType });
      const file = new File([blob], "recorded.webm", { type: fileType });
      onFinish(file);
    }
  };

  const resetStream = () => {
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
  };

  useImperativeHandle(ref, () => ({ ...recorder, start, stop, resetStream }));

  return (
    <div>
      <div className="flex items-center justify-center rounded-t-2xl bg-grey-400 py-1 text-grey-800">
        <div className="flex items-center gap-1">
          <AlertHexagonIcon width={16} height={16} />
          <span className="font-inter text-xs">Max video recording length is 4 minutes</span>
        </div>
      </div>

      <div className="relative flex min-h-100 w-full items-center justify-center overflow-hidden rounded-b-2xl border border-t-0 border-grey-400">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute right-0 top-0 z-0 size-full"
        />
        {recorder.url ? (
          <div className="absolute right-0 top-0 z-50 size-full">
            <VideoPlayer src={recorder.url} />
          </div>
        ) : stream ? (
          <div className="absolute inset-0 z-10 flex flex-col justify-between bg-transparent p-3">
            <div className="flex items-center justify-between">
              <RecIndicator counter={recorder.timer} recoding={recorder.recording} className="bg-white/[22%]! text-white!" />
              <AudioVisualizer
                stream={stream}
                color="white"
                className="bg-white/[22%]"
                recorder={recorder.recorder}
                isRecording={recorder.recording}
              />
            </div>
            <VideoRecButtons
              pause={recorder.pause}
              resume={recorder.resume}
              start={start}
              stop={stop}
              recording={recorder.recording}
              timer={recorder.timer}
            />
          </div>
        ) : (
          <div className="z-10 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <RecIndicator counter={recorder.timer} recoding={recorder.recording} />
              <AudioVisualizer stream={stream} recorder={recorder.recorder} isRecording={recorder.recording} />
            </div>
            <button onClick={start} className="btn flex flex-1 items-center justify-center gap-2">
              <VideoIcon width={20} />
              <span className="font-inter text-sm font-semibold">Start</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
