import { useEffect, useRef, useState } from "react";
import { transcribeAudio } from "@/api/fetcher";
import { createLiveDictation } from "./live-dictation";

export function useOverviewDictation(onTranscript: (text: string) => void) {
  const [phase, setPhase] = useState<
    "idle" | "starting" | "recording" | "paused" | "transcribing"
  >("idle");
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(Array(87).fill(5));
  const [error, setError] = useState("");
  const [canRetry, setCanRetry] = useState(false);
  const speech = useRef<ReturnType<typeof createLiveDictation>>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const meter = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const generation = useRef(0);
  const pending = useRef<Blob | null>(null);
  const transcript = useRef(onTranscript);
  transcript.current = onTranscript;

  function release() {
    clearInterval(timer.current);
    clearInterval(meter.current);
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    void audio.current?.close().catch(() => {});
    audio.current = null;
  }

  function cancel() {
    generation.current++;
    speech.current?.cancel();
    speech.current = null;
    const rec = recorder.current;
    if (rec) {
      rec.onstop = null;
      if (rec.state !== "inactive") rec.stop();
    }
    recorder.current = null;
    release();
    pending.current = null;
    setPhase("idle");
    setError("");
    setCanRetry(false);
  }

  async function transcribe(attempt: number) {
    const recording = pending.current;
    if (!recording) return;
    setPhase("transcribing");
    setError("");
    setCanRetry(false);
    try {
      const ext = recording.type.includes("webm")
        ? "webm"
        : recording.type.includes("ogg")
          ? "ogg"
          : "mp4";
      const result = await transcribeAudio(
        new File([recording], `reflection-${Date.now()}.${ext}`, {
          type: recording.type.split(";")[0].trim(),
        }),
      );
      if (attempt !== generation.current) return;
      if (!result)
        throw new Error("Your recording couldn’t be transcribed. Try again.");
      if (result.full_text?.trim()) transcript.current(result.full_text.trim());
      else setError("No speech was detected. Try recording again.");
      pending.current = null;
    } catch (cause) {
      if (attempt !== generation.current) return;
      setError(
        cause instanceof Error
          ? cause.message
          : "Couldn’t transcribe your recording. Try again.",
      );
      setCanRetry(true);
    } finally {
      if (attempt === generation.current) setPhase("idle");
    }
  }

  async function start() {
    if (recorder.current || phase === "starting" || phase === "transcribing")
      return;
    const attempt = ++generation.current;
    setPhase("starting");
    setError("");
    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      )
        throw new Error(
          "Voice recording isn’t available in this browser. You can type your thoughts instead.",
        );
      const input = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (attempt !== generation.current) {
        input.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = input;
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      speech.current = createLiveDictation();
      await speech.current?.start();
      if (attempt !== generation.current) return;
      const rec = new MediaRecorder(input, mimeType ? { mimeType } : undefined);
      recorder.current = rec;
      const chunks: Blob[] = [];
      rec.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      rec.onstop = async () => {
        const recognition = speech.current;
        const recognized = await recognition?.finish();
        recognition?.cancel();
        if (attempt !== generation.current) return;
        if (speech.current === recognition) speech.current = null;
        release();
        recorder.current = null;
        if (attempt !== generation.current) return;
        if (recognized?.trim()) {
          transcript.current(recognized.trim());
          pending.current = null;
          setCanRetry(false);
          setPhase("idle");
          return;
        }
        const blob = new Blob(chunks, {
          type: rec.mimeType || mimeType || "audio/webm",
        });
        if (!blob.size) {
          setPhase("idle");
          setError("No audio was recorded. Try again.");
          return;
        }
        pending.current = blob;
        void transcribe(attempt);
      };
      rec.onerror = () => {
        cancel();
        setError("Recording stopped unexpectedly. Please try again.");
      };
      rec.start(1000);
      setSeconds(0);
      setLevels(Array(87).fill(5));
      setPhase("recording");
      timer.current = setInterval(() => {
        if (rec.state === "recording") setSeconds((value) => value + 1);
      }, 1000);
      // A real microphone meter; recording remains available without Web Audio.
      try {
        const context = new AudioContext();
        audio.current = context;
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        context.createMediaStreamSource(input).connect(analyser);
        const samples = new Uint8Array(analyser.fftSize);
        meter.current = setInterval(() => {
          if (rec.state !== "recording") return;
          analyser.getByteTimeDomainData(samples);
          const rms = Math.sqrt(
            samples.reduce(
              (sum, value) => sum + ((value - 128) / 128) ** 2,
              0,
            ) / samples.length,
          );
          setLevels((previous) => [
            ...previous.slice(1),
            Math.min(32, Math.max(5, rms * 160)),
          ]);
        }, 80);
      } catch {
        /* Audio recording does not depend on waveform support. */
      }
    } catch (cause) {
      if (attempt !== generation.current) return;
      speech.current?.cancel();
      speech.current = null;
      release();
      recorder.current = null;
      setPhase("idle");
      setError(
        cause instanceof DOMException && cause.name === "NotAllowedError"
          ? "Allow microphone access to record. You can also type your thoughts below."
          : cause instanceof Error
            ? cause.message
            : "Couldn’t start recording. Please try again.",
      );
    }
  }

  function stop() {
    const rec = recorder.current;
    if (rec && rec.state !== "inactive") {
      setPhase("transcribing");
      rec.stop();
    }
  }
  function togglePause() {
    const rec = recorder.current;
    if (rec?.state === "recording") {
      speech.current?.pause();
      rec.pause();
      setPhase("paused");
    } else if (rec?.state === "paused") {
      speech.current?.resume();
      rec.resume();
      setPhase("recording");
    }
  }
  useEffect(
    () => () => {
      generation.current++;
      speech.current?.cancel();
      speech.current = null;
      const rec = recorder.current;
      if (rec) {
        rec.onstop = null;
        if (rec.state !== "inactive") rec.stop();
      }
      release();
    },
    [],
  );
  return {
    phase,
    seconds,
    levels,
    error,
    canRetry,
    start,
    stop,
    cancel,
    togglePause,
    retry: () => transcribe(generation.current),
  };
}
