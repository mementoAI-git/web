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

/**
 * MP4/AAC comes first because it plays everywhere, including Safari, iPhones and the
 * mobile app. WebM recorded in Chrome may not play back on those.
 */
const RECORDING_FORMATS = [
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg",
];
/** Speech doesn't need more, and it keeps long recordings inside the upload limit. */
const RECORDING_BITRATE = 64000;
/** Below this the mic is effectively sending nothing. */
const SILENT_RMS = 0.0005;
const SILENT_TICKS = 30;
/** A format that fails this soon is broken here, and little enough has been said to redo it. */
const FORMAT_RETRY_SECONDS = 2;
/** Formats this browser claimed but couldn't record, so later recordings skip them. */
const brokenFormats = new Set<string>();

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
  const [silent, setSilent] = useState(false);
  const speech = useRef<ReturnType<typeof createLiveDictation>>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const meterSource = useRef<MediaStreamAudioSourceNode | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const meter = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const request = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const pending = useRef<Blob | null>(null);
  const heard = useRef("");
  const elapsed = useRef(0);
  const latest = useRef(options);
  latest.current = options;

  function release() {
    clearInterval(timer.current);
    clearInterval(meter.current);
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    meterSource.current?.disconnect();
    meterSource.current = null;
    void audio.current?.close().catch(() => {});
    audio.current = null;
    setSilent(false);
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
      // The full audio couldn't be transcribed, but what the browser heard beats nothing.
      const receiver = latest.current;
      if (heard.current && receiver.mode === "text") {
        receiver.onTranscript(heard.current);
        heard.current = "";
        pending.current = null;
        return;
      }
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
    // Made here, before anything async, while the browser still counts this as the tap.
    // Safari leaves a context created later suspended, which reads as permanent silence.
    let meterContext: AudioContext | null = null;
    try {
      meterContext = new AudioContext();
      void meterContext.resume().catch(() => {});
      audio.current = meterContext;
    } catch {
      /* Recording doesn't depend on the waveform. */
    }
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
      // Permission can succeed with a track that's already dead, as in the iOS Simulator.
      // Recording from it would only ever produce an empty file, so say so straight away.
      const micTrack = input.getAudioTracks?.()[0];
      if (micTrack?.readyState === "ended") {
        input.getTracks().forEach((track) => track.stop());
        throw new Error(
          "Your microphone isn’t sending any audio. Check that it’s available and try again.",
        );
      }
      stream.current = input;
      if (latest.current.mode === "text") {
        speech.current = createLiveDictation();
        await speech.current?.start();
        if (attempt !== generation.current) return;
      }
      const launch = (formats: string[]) => {
        const [format, ...remaining] = formats;
        const rec = new MediaRecorder(input, {
          ...(format ? { mimeType: format } : {}),
          audioBitsPerSecond: RECORDING_BITRATE,
        });
        recorder.current = rec;
        const chunks: Blob[] = [];
        rec.ondataavailable = (event) => {
          if (event.data.size) chunks.push(event.data);
        };
        rec.onstop = async () => {
          const recognition = speech.current;
          const recognized = await recognition?.finish();
          heard.current = recognition?.heard().trim() ?? "";
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
            type: rec.mimeType || format || "audio/webm",
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
          if (attempt !== generation.current) return;
          if (format) brokenFormats.add(format);
          // Browsers can claim a format, then fail as soon as it encodes. Moments in, nothing
          // has been lost, so quietly carry on in the next one.
          if (elapsed.current <= FORMAT_RETRY_SECONDS && remaining.length) {
            rec.onstop = null;
            rec.ondataavailable = null;
            try {
              if (rec.state !== "inactive") rec.stop();
            } catch {
              /* Already stopped by the failure. */
            }
            launch(remaining);
            return;
          }
          // Later than that, keep whatever was captured rather than throwing it away.
          if (chunks.length) {
            setError("Recording stopped early. We kept what was captured.");
            if (rec.state !== "inactive") rec.stop();
            else void rec.onstop?.(new Event("stop"));
            return;
          }
          cancel();
          setError("Recording stopped unexpectedly. Please try again.");
        };
        rec.start(1000);
      };
      launch(
        RECORDING_FORMATS.filter(
          (type) => MediaRecorder.isTypeSupported(type) && !brokenFormats.has(type),
        ),
      );
      elapsed.current = 0;
      setSeconds(0);
      setLevels(Array(87).fill(5));
      setPhase("recording");
      timer.current = setInterval(() => {
        if (recorder.current?.state === "recording") {
          elapsed.current += 1;
          setSeconds(elapsed.current);
        }
      }, 1000);
      // A real microphone meter; recording remains available without Web Audio.
      try {
        if (meterContext) {
          const context = meterContext;
          const analyser = context.createAnalyser();
          analyser.fftSize = 1024;
          // Held in a ref: an unreferenced source node can be garbage collected mid-recording.
          meterSource.current = context.createMediaStreamSource(input);
          meterSource.current.connect(analyser);
          const samples = new Float32Array(analyser.fftSize);
          const track = input.getAudioTracks()[0];
          let quietTicks = 0;
          meter.current = setInterval(() => {
            if (recorder.current?.state !== "recording") return;
            if (context.state === "suspended") void context.resume().catch(() => {});
            analyser.getFloatTimeDomainData(samples);
            const rms = Math.sqrt(
              samples.reduce((sum, value) => sum + value * value, 0) /
                samples.length,
            );
            quietTicks = rms < SILENT_RMS || track?.muted ? quietTicks + 1 : 0;
            setSilent(quietTicks >= SILENT_TICKS);
            setLevels((previous) => [...previous.slice(1), meterHeight(rms)]);
          }, 100);
        }
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
    silent,
    start,
    stop,
    cancel,
    togglePause,
    retry: () => transcribe(generation.current),
  };
}
