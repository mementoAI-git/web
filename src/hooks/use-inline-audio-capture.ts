import { useEffect, useRef, useState } from "react";
import useRecorder from "@/hooks/use-recorder";
import { useAudioLevels } from "@/hooks/use-audio-levels";

type UseInlineAudioCaptureOptions = {
  onRecordingReady: (file: File, durationSec: number) => Promise<void> | void;
  mimeType?: string;
  fileNamePrefix?: string;
  startDelayMs?: number;
};

export function useInlineAudioCapture({
  onRecordingReady,
  mimeType = "audio/webm",
  fileNamePrefix = "voice-note",
  startDelayMs = 200,
}: UseInlineAudioCaptureOptions) {
  const onReadyRef = useRef(onRecordingReady);
  onReadyRef.current = onRecordingReady;
  const mounted = useRef(true);
  const acquiring = useRef(false);
  const startTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; clearTimeout(startTimer.current); };
  }, []);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const rec = useRecorder(stream, mimeType);
  const recRef = useRef(rec);
  recRef.current = rec;

  const levels = useAudioLevels(stream, !!rec.recording);
  const [busy, setBusy] = useState(false);
  const [pendingFinalize, setPendingFinalize] = useState(false);
  const [lastRecordedSeconds, setLastRecordedSeconds] = useState(0);
  const [micDenied, setMicDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleRecording = (blocked = false) => {
    if (blocked || busy || acquiring.current) return;
    if (rec.recording) {
      setLastRecordedSeconds(recRef.current.timer);
      setPendingFinalize(true);
      setError(null);
      recRef.current.stop();
      return;
    }

    setMicDenied(false);
    setError(null);
    if (!stream) {
      if (!navigator.mediaDevices?.getUserMedia) { setError("Voice recording isn’t available in this browser."); return; }
      acquiring.current = true;
      setBusy(true);
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((media) => {
          if (!mounted.current) { media.getTracks().forEach((track) => track.stop()); return; }
          setStream(media);
          startTimer.current = setTimeout(() => {
            acquiring.current = false;
            setBusy(false);
            recRef.current.start();
          }, startDelayMs);
        })
        .catch(() => { acquiring.current = false; if (mounted.current) { setBusy(false); setMicDenied(true); } });
      return;
    }
    recRef.current.start();
  };

  useEffect(() => {
    const url = rec.url;
    if (!pendingFinalize || !url) return;

    let cancelled = false;
    (async () => {
      setBusy(true);
      try {
        const blob = await fetch(url).then((r) => r.blob());
        if (cancelled) return;
        const file = new File([blob], `${fileNamePrefix}-${Date.now()}.webm`, {
          type: blob.type || mimeType,
        });
        await onReadyRef.current(file, lastRecordedSeconds);
      } catch {
        if (!cancelled) setError("Recording couldn't be saved. Try again.");
      } finally {
        if (!cancelled) {
          recRef.current.reset();
          setStream(null);
          setPendingFinalize(false);
          setBusy(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pendingFinalize, rec.url, lastRecordedSeconds, fileNamePrefix, mimeType]);

  return {
    recording: rec.recording,
    timerSec: rec.timer,
    levels,
    busy,
    micDenied,
    error,
    setError,
    toggleRecording,
  };
}
