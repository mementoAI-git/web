import { useState, useRef, useEffect } from "react";
import useRecorder from "@/hooks/use-recorder";
import RecIndicator from "@/components/RecIndicator";
import MovingBarsWaveform from "@/components/MovingBarsWaveform";
import StopRecIcon from "@/public/icon/stop-rec.svg";
import PauseRecIcon from "@/public/icon/pause-rec.svg";
import MicIcon from "@/public/icon/mic.svg";
import { toast } from "sonner";

interface IRecordingInput {
  onFinish: (file: File) => void;
  onCancel: () => void;
}

export default function RecordingInput({ onFinish, onCancel }: IRecordingInput) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const recorder = useRecorder(stream, "audio/webm");

  const startRecording = () => {
    navigator.mediaDevices
      .getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })
      .then((stream) => {
        if (stream) {
          setStream(stream);
          setTimeout(() => recorder.start(), 100);
        }
      })
      .catch(() => {
        toast.error("Mic access denied or not available.", {
          className: "!text-danger",
        });
        onCancel();
      });
  };

  const stopRecording = () => {
    recorder.stop();
    if (recorder.chunks && recorder.chunks.length > 0) {
      const blob = new Blob(recorder.chunks, { type: "audio/webm" });
      const file = new File([blob], "voice-message.webm", { type: "audio/webm" });
      onFinish(file);
    }
  };

  const handlePause = () => {
    if (recorder.recording) {
      recorder.pause();
    } else if (recorder.timer > 0) {
      recorder.resume();
    }
  };

  // Start recording immediately when component mounts
  useEffect(() => {
    startRecording();
  }, []);

  return (
    <div className="w-full border border-primary rounded-2xl p-10 flex flex-col gap-8 h-fit min-w-lg min-h-46 bg-white z-50">
      <div className="flex flex-col items-center justify-center gap-4 py-4">
        <MovingBarsWaveform
          stream={stream}
          isRecording={recorder.recording}
          width={320}
          height={30}
          barCount={32}
          color="#000000"
        />
      </div>

      <div className="flex items-center justify-center gap-3">
        {recorder.recording ? (
          <button
            onClick={handlePause}
            className="btn flex items-center justify-center gap-2 !bg-[#F5FAFF] !text-[#2E90FA]"
          >
            <PauseRecIcon width={12} />
            <span className="font-inter text-sm font-semibold">Pause</span>
          </button>
        ) : recorder.timer > 0 ? (
          <button
            onClick={handlePause}
            className="btn flex items-center justify-center gap-2 !bg-[#F5FAFF] !text-[#2E90FA]"
          >
            <MicIcon width={12} />
            <span className="font-inter text-sm font-semibold">Resume</span>
          </button>
        ) : null}

        <button
          onClick={stopRecording}
          className="btn flex items-center justify-center gap-2 !bg-[#FEF3F2] !text-[#F97066]"
        >
          <StopRecIcon width={15} />
          <span className="font-inter text-sm font-semibold">Stop</span>
        </button>

      </div>
    </div>
  );
}