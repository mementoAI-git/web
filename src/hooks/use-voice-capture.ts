import { useEffect, useRef, useState } from "react";
import { transcribeAudio } from "@/api/fetcher";
import { createLiveDictation } from "@/lib/live-dictation";

export type VoiceCapturePhase =
  | "idle"
  | "starting"
  | "recording"
  | "paused"
  | "transcribing"
  | "saving";

export type VoiceCaptureOptions =
  /** Speech becomes text; the audio itself is discarded. */
  | { mode: "text"; onTranscript: (text: string) => void }
  /** The audio is kept and handed back as a file. */
  | { mode: "audio"; onAudio: (file: File, durationSeconds: number) => void };

/**
 * Maps loudness to a bar height the way the mobile recorder does. Speech is quiet in
 * linear terms (RMS around 0.01–0.1), so scaling in decibels is what makes bars move.
 */
export function meterHeight(rms: number) {
  const decibels = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
  const amplitude = Math.max(0, Math.min(1, (decibels + 60) / 60));
  return Math.max(5, 3 + amplitude * 29);
}

function audioExtension(mimeType: string) {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("ogg")) return "ogg";
  return "mp4";
}

export function useVoiceCapture(options: VoiceCaptureOptions) {
  const [phase, setPhase] = useState<VoiceCapturePhase>("idle");
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
  const request = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const pending = useRef<Blob | null>(null);
  const elapsed = useRef(0);
  const latest = useRef(options);
  latest.current = options;

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
    request.current?.abort();
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
    const current = latest.current;
    if (!recording || request.current || current.mode !== "text") return;
    const controller = new AbortController();
    request.current = controller;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    setPhase("transcribing");
    setError("");
    setCanRetry(false);
    try {
      const result = await Promise.race([transcribeAudio(
        new File([recording], `reflection-${Date.now()}.${audioExtension(recording.type)}`, {
          type: recording.type.split(";")[0].trim(),
        }),
        controller.signal,
      ), new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          reject(new Error("Transcription is taking too long. Your recording is ready to retry."));
          controller.abort();
        }, 30000);
      })]);
      if (attempt !== generation.current) return;
      if (!result)
        throw new Error("Your recording couldn’t be transcribed. Try again.");
      if (result.full_text?.trim()) {
        const receiver = latest.current;
        if (receiver.mode === "text") receiver.onTranscript(result.full_text.trim());
      } else setError("No speech was detected. Try recording again.");
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
      clearTimeout(timeout);
      if (request.current === controller) request.current = null;
      if (attempt === generation.current) setPhase("idle");
    }
  }

  async function start() {
    if (recorder.current || phase === "starting" || phase === "transcribing" || phase === "saving")
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
          latest.current.mode === "text"
            ? "Voice recording isn’t available in this browser. You can type your thoughts instead."
            : "Voice recording isn’t available in this browser.",
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
      if (latest.current.mode === "text") {
        speech.current = createLiveDictation();
        await speech.current?.start();
        if (attempt !== generation.current) return;
      }
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
          const receiver = latest.current;
          if (receiver.mode === "text") receiver.onTranscript(recognized.trim());
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
        const current = latest.current;
        if (current.mode === "audio") {
          setPhase("idle");
          current.onAudio(
            new File([blob], `recording-${Date.now()}.${audioExtension(blob.type)}`, {
              type: blob.type.split(";")[0].trim(),
            }),
            elapsed.current,
          );
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
      elapsed.current = 0;
      setSeconds(0);
      setLevels(Array(87).fill(5));
      setPhase("recording");
      timer.current = setInterval(() => {
        if (rec.state === "recording") {
          elapsed.current += 1;
          setSeconds(elapsed.current);
        }
      }, 1000);
      // A real microphone meter; recording remains available without Web Audio.
      try {
        const context = new AudioContext();
        audio.current = context;
        // Recording can start outside a tap, which leaves the context suspended and silent.
        void context.resume().catch(() => {});
        const analyser = context.createAnalyser();
        analyser.fftSize = 1024;
        context.createMediaStreamSource(input).connect(analyser);
        const samples = new Float32Array(analyser.fftSize);
        meter.current = setInterval(() => {
          if (rec.state !== "recording") return;
          analyser.getFloatTimeDomainData(samples);
          const rms = Math.sqrt(
            samples.reduce((sum, value) => sum + value * value, 0) /
              samples.length,
          );
          setLevels((previous) => [...previous.slice(1), meterHeight(rms)]);
        }, 100);
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
          ? latest.current.mode === "text"
            ? "Allow microphone access to record. You can also type your thoughts below."
            : "Allow microphone access to record."
          : cause instanceof Error
            ? cause.message
            : "Couldn’t start recording. Please try again.",
      );
    }
  }

  function stop() {
    const rec = recorder.current;
    if (rec && rec.state !== "inactive") {
      setPhase(latest.current.mode === "text" ? "transcribing" : "saving");
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
      request.current?.abort();
      speech.current?.cancel();
      speech.current = null;
      const rec = recorder.current;
      if (rec) {
        rec.onstop = null;
        if (rec.state !== "inactive") rec.stop();
      }
      recorder.current = null;
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
