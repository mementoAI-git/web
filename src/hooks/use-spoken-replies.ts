import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { requestSpokenAudio, takeSpokenStream, type SpokenAudio } from "@/features/speech/spoken-audio";

function speechErrorMessage(error: unknown, phase: "request" | "playback") {
  if (phase === "playback") {
    if (typeof error === "object" && error !== null && "name" in error && error.name === "NotAllowedError") {
      return "Your browser blocked audio playback. Allow sound for this site, then turn spoken replies on again.";
    }
    return "Couldn’t play this reply’s audio. Please turn spoken replies on to try again.";
  }
  const failure = error as { httpStatus?: number; status?: number; message?: string } | null;
  const status = failure?.httpStatus ?? failure?.status;
  if (status === 404) return "Spoken replies aren’t available on this server yet. Please try again after the server is updated.";
  if (status === 429) return "Spoken replies are temporarily rate limited. Please try again shortly.";
  if (status === 409 && failure?.message === "This action is not simulated in new user preview. Switch preview off to use it.") {
    return "Spoken replies aren’t available in new user preview. Switch preview off to use them.";
  }
  if (status === 401) return "Please sign in again to use spoken replies.";
  if (status === 403) return "Spoken replies aren’t available for your account.";
  if (status && status >= 500) return "The speech service is temporarily unavailable. Please try again shortly.";
  return "Couldn’t generate this reply’s audio. Check your connection and try again.";
}

type ClipResult = { data: SpokenAudio; error: null } | { data: null; error: unknown };
type SpeechSession = {
  controller: AbortController;
  text: string;
  remainder: string;
  queue: string[];
  first: boolean;
  complete: boolean;
  running: boolean;
  pending?: Promise<ClipResult>;
  audio?: HTMLAudioElement;
  url?: string;
  finish?: () => void;
};

/** Narrate new streamed sentences; historical replies stay silent. */
export function useSpokenReplies(conversationId: string, voiceActive = false) {
  const supported = typeof window !== "undefined" && typeof Audio === "function" && typeof URL.createObjectURL === "function";
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const enabledRef = useRef(false);
  const voiceActiveRef = useRef(voiceActive);
  const current = useRef<SpeechSession | null>(null);

  const stop = useCallback(() => {
    const session = current.current;
    current.current = null;
    if (!session) return;
    session.controller.abort();
    session.audio?.pause();
    session.audio?.removeAttribute("src");
    session.finish?.();
    if (session.url) URL.revokeObjectURL(session.url);
    session.url = undefined;
    setIsLoading(false);
  }, []);

  useEffect(() => {
    voiceActiveRef.current = voiceActive;
    if (voiceActive) stop();
  }, [voiceActive, stop]);
  useEffect(() => stop, [conversationId, stop]);

  const toggle = useCallback(() => {
    if (!supported) return;
    enabledRef.current = !enabledRef.current;
    setEnabled(enabledRef.current);
    if (!enabledRef.current) stop();
  }, [supported, stop]);

  const load = useCallback((session: SpeechSession, chunk: string): Promise<ClipResult> =>
    requestSpokenAudio(chunk, session.controller.signal)
      .then(data => ({data, error: null}), error => ({data: null, error})), []);

  const prefetch = useCallback((session: SpeechSession) => {
    // One clip ahead: keep requests bounded even when text arrives much faster than speech.
    if (!session.pending && session.queue.length) session.pending = load(session, session.queue.shift()!);
  }, [load]);

  const pump = useCallback(function pumpSession(session: SpeechSession) {
    if (session.running) { prefetch(session); return; }
    if (!session.pending && !session.queue.length) return;
    session.running = true;
    const active = () => current.current === session && !session.controller.signal.aborted;
    let phase: "request" | "playback" = "request";
    const run = async () => {
      while (active() && (session.pending || session.queue.length)) {
        setIsLoading(true);
        prefetch(session);
        const pending = session.pending!;
        session.pending = undefined;
        prefetch(session);
        const clip = await pending;
        if (!active()) return;
        if (!clip.data) throw clip.error;
        phase = "playback";
        const bytes = Uint8Array.from(atob(clip.data.audioBase64), c => c.charCodeAt(0));
        session.url = URL.createObjectURL(new Blob([bytes], {type: clip.data.mimeType}));
        session.audio = new Audio(session.url);
        prefetch(session);
        setIsLoading(false);
        try {
          await new Promise<void>((resolve, reject) => {
            session.finish = resolve;
            session.audio!.onended = () => { if (active()) resolve(); };
            session.audio!.onerror = () => { if (active()) reject(new Error("Audio playback failed")); };
            session.audio!.play().catch(reject);
          });
        } finally {
          if (session.url) URL.revokeObjectURL(session.url);
          session.url = undefined;
          session.finish = undefined;
          session.audio = undefined;
        }
        phase = "request";
      }
      if (active()) setIsLoading(false);
    };
    void run().catch((error: unknown) => {
      if (!active()) return;
      stop();
      enabledRef.current = false;
      setEnabled(false);
      toast.error(speechErrorMessage(error, phase));
    }).finally(() => {
      session.running = false;
      if (active() && (session.pending || session.queue.length)) pumpSession(session);
    });
  }, [prefetch, stop]);

  const stream = useCallback((text: string, complete = false) => {
    if (!supported || !enabledRef.current || voiceActiveRef.current || !text.trim()) return;
    let session = current.current;
    if (session && !text.startsWith(session.text) && text.trim() !== session.text.trim()) {
      stop();
      session = null;
    }
    if (!session) {
      session = { controller: new AbortController(), text: "", remainder: "", queue: [], first: true, complete: false, running: false };
      current.current = session;
    }
    if (session.complete) return;
    const delta = text.startsWith(session.text) ? text.slice(session.text.length) : "";
    session.text = text;
    const next = takeSpokenStream(session.remainder + delta, complete, session.first);
    session.remainder = next.remainder;
    session.complete = complete;
    if (next.chunks.length) session.first = false;
    session.queue.push(...next.chunks);
    pump(session);
  }, [supported, stop, pump]);

  const speak = useCallback((text: string) => {
    if (!supported || !enabledRef.current || voiceActiveRef.current) return;
    stop();
    stream(text, true);
  }, [supported, stop, stream]);

  return { enabled, supported, isLoading, toggle, speak, stream, stop };
}
