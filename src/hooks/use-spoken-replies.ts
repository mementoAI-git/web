import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { requestSpokenAudio, spokenReplyChunks } from "@/features/speech/spoken-audio";

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

/** Narrate new completed replies using the saved Gemini voice; history stays silent. */
export function useSpokenReplies(conversationId: string, voiceActive = false) {
  const supported = typeof window !== "undefined" && typeof Audio === "function" && typeof URL.createObjectURL === "function";
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const enabledRef = useRef(false);
  const voiceActiveRef = useRef(voiceActive);
  const current = useRef<{ controller: AbortController; audio?: HTMLAudioElement; url?: string; finish?: () => void } | null>(null);

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

  const speak = useCallback((text: string) => {
    if (!supported || !enabledRef.current || voiceActiveRef.current) return;
    const chunks = spokenReplyChunks(text);
    if (!chunks.length) return;
    stop();
    const session: NonNullable<typeof current.current> = { controller: new AbortController() };
    current.current = session;
    const active = () => current.current === session && !session.controller.signal.aborted;
    // Attach both handlers immediately so a failed prefetched clip cannot reject unhandled.
    const load = (chunk: string) => requestSpokenAudio(chunk, session.controller.signal)
      .then(data => ({ data, error: null }), error => ({ data: null, error }));
    const run = async () => {
      setIsLoading(true);
      let pending = load(chunks[0]);
      for (let index = 0; index < chunks.length; index++) {
        const clip = await pending;
        if (!active()) return;
        if (!clip.data) throw clip.error;
        phase = "playback";
        if (index + 1 < chunks.length) pending = load(chunks[index + 1]);
        const bytes = Uint8Array.from(atob(clip.data.audioBase64), c => c.charCodeAt(0));
        session.url = URL.createObjectURL(new Blob([bytes], { type: clip.data.mimeType }));
        session.audio = new Audio(session.url);
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
        if (!active()) return;
        phase = "request";
        if (index + 1 < chunks.length) setIsLoading(true);
      }
      if (active()) { current.current = null; setIsLoading(false); }
    };
    let phase: "request" | "playback" = "request";
    void run().catch((error: unknown) => {
      if (!active()) return;
      stop();
      enabledRef.current = false;
      setEnabled(false);
      toast.error(speechErrorMessage(error, phase));
    });
  }, [supported, stop]);

  return { enabled, supported, isLoading, toggle, speak, stop };
}
