import { useCallback, useEffect, useRef, useState } from "react";
import { isEmpty } from "@/utility";

export default function useRecorder(stream: MediaStream | null, mimeType = "video/mp4") {
  const [timer, setTimer] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const chunksRef = useRef<Blob[]>([]);

  const start = () => {
    if (!recorderRef.current) return;
    recorderRef.current.start(1000);
    chunksRef.current = [];
  };

  const save = () => {
    if (isEmpty(chunksRef.current)) return;
    const blob = new Blob(chunksRef.current, { type: mimeType });
    setUrl(URL.createObjectURL(blob));
    chunksRef.current = [];
  };

  const stop = () => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      try {
        rec.stop();
      } catch {
        /* MediaRecorder.stop() throws if already inactive in some browsers */
      }
    }
    stream?.getTracks().forEach((track) => track.stop());
  };

  const pause = () => {
    if (!recorderRef.current || recorderRef.current.state !== "recording") return;
    recorderRef.current.pause();
  };

  const resume = () => {
    if (!recorderRef.current) return;
    recorderRef.current.resume();
  };

  const reset = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    setRecording(false);
    setTimer(0);
    if (url) {
      URL.revokeObjectURL(url);
    }
    setUrl(null);
    stop();
  };

  const setupRecorder = useCallback(() => {
    if (!stream) return;
    recorderRef.current = new MediaRecorder(stream, { mimeType });

    recorderRef.current.onstart = () => {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
      setRecording(true);
    };

    recorderRef.current.onpause = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecording(false);
    };

    recorderRef.current.onresume = () => {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
      setRecording(true);
    };

    recorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorderRef.current.onstop = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecording(false);
      save();
    };
  }, [stream, mimeType]);

  useEffect(() => {
    setupRecorder();
    return () => {
      stop();
    };
  }, [setupRecorder, stream]);

  return {
    recording,
    recorder: recorderRef.current,
    chunks: chunksRef.current,
    stop,
    start,
    pause,
    resume,
    url,
    save,
    timer,
    reset,
  };
}
