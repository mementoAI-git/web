import useRecorder from "@/hooks/use-recorder";
import AletHexagonIcon from "@/public/icon/alert-hexagon.svg";
import { forwardRef, useImperativeHandle, useState } from "react";
import AudioPlayer from "../Player/AudioPlayer";
import RecIndicator from "../RecIndicator";
import AudioVisualizer from "../AudioVisualizer";
import { AudioRecButtons } from "./RecButtons";
import { toast } from "sonner";
import { IRecorder } from "./interface";

const fileType = "audio/webm";

export const AudioRecorder = forwardRef(function AudioRec({ onStart, onFinish }: IRecorder, ref) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const recorder = useRecorder(stream, fileType);

  const start = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (stream) {
          setStream(stream);
          onStart(stream);
          setTimeout(() => recorder.start(), 2000);
        }
      })
      .catch(() => {
        toast.error("Mic access denied or not available.", {
          className: "!text-danger",
        });
      });
  };

  const stop = () => {
    recorder.stop()
    if (recorder.chunks) {
      const blob = new Blob(recorder.chunks, { type: fileType });
      const file = new File([blob], "recorded.mp3", { type: fileType });

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
            Max audio recording length is 4 minutes
          </span>
        </div>
      </div>
      {
        recorder.url ?
          <AudioPlayer src={recorder.url} className="min-h-100 rounded-b-2xl rounded-t-none" /> :
          <div className="flex min-h-100 w-full items-center justify-center rounded-b-2xl border border-t-0 border-grey-400">
            <div>
              <div className="flex flex-col gap-3 self-center">
                <div className="flex items-center gap-2">
                  <RecIndicator
                    counter={recorder.timer}
                    recoding={recorder.recording}
                  />
                  <AudioVisualizer
                    stream={stream}
                    recorder={recorder.recorder}
                    isRecording={recorder.recording}
                  />
                </div>
                <AudioRecButtons {...{ ...recorder, start, stop: stop }} />
              </div>
            </div>
          </div>
      }
    </div>
  )
})