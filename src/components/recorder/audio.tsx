"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { toast } from "sonner";
import AudioVisualizer from "@/components/audio-visualizer";
import RecIndicator from "@/components/rec-indicator";
import AudioPlayer from "@/components/player/audio-player";
import { AlertHexagonIcon } from "@/components/icons";
import useRecorder from "@/hooks/use-recorder";
import type { RecorderProps } from "./interface";
import { AudioRecButtons } from "./rec-buttons";

const fileType = "audio/webm";

export const AudioRecorder = forwardRef<ReturnType<typeof useRecorder> & { start: () => void; stop: () => void }, RecorderProps>(
  function AudioRecorderComponent({ onStart, onFinish }, ref) {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const recorder = useRecorder(stream, fileType);

    const start = () => {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((mediaStream) => {
          if (mediaStream) {
            setStream(mediaStream);
            onStart(mediaStream);
            setTimeout(() => recorder.start(), 2000);
          }
        })
        .catch(() => {
          toast.error("Mic access denied or not available.", {
            className: "text-danger!",
          });
        });
    };

    const stop = () => {
      recorder.stop();
      if (recorder.chunks && recorder.chunks.length > 0) {
        const blob = new Blob(recorder.chunks, { type: fileType });
        const file = new File([blob], "recorded.webm", { type: fileType });
        onFinish(file);
      }
    };

    useImperativeHandle(ref, () => ({ ...recorder, start, stop }));

    return (
      <div>
        <div className="flex items-center justify-center rounded-t-2xl bg-grey-400 py-1 text-grey-800">
          <div className="flex items-center gap-1">
            <AlertHexagonIcon width={16} height={16} />
            <span className="font-inter text-xs">Max audio recording length is 4 minutes</span>
          </div>
        </div>
        {recorder.url ? (
          <AudioPlayer src={recorder.url} className="min-h-100 rounded-b-2xl rounded-t-none" />
        ) : (
          <div className="flex min-h-100 w-full items-center justify-center rounded-b-2xl border border-t-0 border-grey-400">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <RecIndicator counter={recorder.timer} recoding={recorder.recording} />
                <AudioVisualizer stream={stream} recorder={recorder.recorder} isRecording={recorder.recording} />
              </div>
              <AudioRecButtons
                pause={recorder.pause}
                resume={recorder.resume}
                start={start}
                stop={stop}
                recording={recorder.recording}
                timer={recorder.timer}
              />
            </div>
          </div>
        )}
      </div>
    );
  },
);
