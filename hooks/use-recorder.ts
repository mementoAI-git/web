import { isEmpty } from "@/utility";
import { useCallback, useEffect, useRef, useState } from "react";

export default function useRecorder(stream: MediaStream | null, type = "video/mp4") {
  const [timer, setTimer] = useState(0); // secs
  const [url, setUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const timeId = useRef<NodeJS.Timeout | undefined>(undefined);
  const chunks = useRef<Blob[]>([]);

  const start = () => {
    if (!recorder.current) return;
    recorder.current.start(1000);
    chunks.current = [];
  };

  const save = () => {
    if (isEmpty(chunks.current)) return;
    const blob = new Blob(chunks.current, { type });
    setUrl(URL.createObjectURL(blob));
    chunks.current = []
  };

  const stop = () => {
    if (!recorder.current) return;
    recorder.current.stop();
    stream.getTracks().forEach((track) => track.stop());
  };

  const pause = () => {
    if (!recorder.current || recorder.current.state !== "recording") return;
    recorder.current.pause();
  };

  const resume = () => {
    if (!recorder.current) return;
    recorder.current.resume();
  };

  const reset = () => {
    stop()
    setUrl(null)
    setRecording(false)
    setTimer(0)
    clearInterval(timeId.current);
  }

  const setUpRecorder = useCallback(() => {
    if (!stream) return;
    recorder.current = new MediaRecorder(stream, { mimeType: type });

    recorder.current.onstart = () => {
      timeId.current = setInterval(() => {
        setTimer((p) => p + 1);
      }, 1000);
      setRecording(true);
    };

    recorder.current.onpause = () => {
      if (timeId.current) {
        clearInterval(timeId.current);
      }
      setRecording(false);
    };

    recorder.current.onresume = () => {
      timeId.current = setInterval(() => {
        setTimer((p) => p + 1);
      }, 1000);
      setRecording(true);
    };

    recorder.current.ondataavailable = (ev) => {
      if (ev.data.size > 0) {
        chunks.current.push(ev.data);
      }
    };

    recorder.current.onstop = () => {
      if (timeId.current) {
        clearInterval(timeId.current);
      }
      setRecording(false);
      save();
    };
  }, [stream])

  useEffect(() => {
    setUpRecorder()

    return () => {
      stop()
    }
  }, [stream]);

  return {
    recording,
    recorder: recorder.current,
    chunks: chunks.current,
    stop,
    start,
    pause,
    resume,
    url,
    save,
    timer,
    reset
  };
}
