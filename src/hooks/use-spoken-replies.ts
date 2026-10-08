import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/** Speak completed text replies only; history and voice sessions stay silent. */
export function useSpokenReplies(conversationId: string, voiceActive = false) {
  const supported = typeof window !== "undefined" && Boolean(window.speechSynthesis) && typeof window.SpeechSynthesisUtterance === "function";
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);
  const voiceActiveRef = useRef(voiceActive);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (utteranceRef.current) {
      utteranceRef.current = null;
      window.speechSynthesis?.cancel();
    }
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
    const plainText = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/^\s{0,3}(?:#{1,6}\s+|>\s*|[-*+]\s+)/gm, "")
      .replace(/[*`~]/g, "")
      .trim();
    if (!plainText) return;
    stop();
    const utterance = new SpeechSynthesisUtterance(plainText);
    utteranceRef.current = utterance;
    utterance.onend = () => {
      if (utteranceRef.current === utterance) utteranceRef.current = null;
    };
    utterance.onerror = () => {
      // Cancellation callbacks from an earlier reply must not disable a new one.
      if (utteranceRef.current !== utterance) return;
      utteranceRef.current = null;
      enabledRef.current = false;
      setEnabled(false);
      toast.error("Couldn't read this reply aloud. Try turning spoken replies on again.");
    };
    window.speechSynthesis.speak(utterance);
  }, [supported, stop]);

  return { enabled, supported, toggle, speak, stop };
}
