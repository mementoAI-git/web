import { useCallback, useEffect, useRef, useState } from "react";
interface SpeechResult {
  results: {
    [index: number]: {
      isFinal?: boolean;
      [index: number]: { transcript: string };
    };
  };
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechResult) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
interface SpeechWindow extends Window {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
}
export function usePeopleSpeech({
  enabled,
  onDictation,
  onVoiceMessage,
}: {
  enabled: boolean;
  onDictation: (text: string) => void;
  onVoiceMessage: (text: string) => Promise<string | null>;
}) {
  const Constructor =
    (window as SpeechWindow).SpeechRecognition ||
    (window as SpeechWindow).webkitSpeechRecognition;
  const supported = Boolean(Constructor);
  const callSupported =
    supported &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined";
  const [status, setStatus] = useState<
    "idle" | "listening" | "answering" | "speaking"
  >("idle");
  const [calling, setCalling] = useState(false);
  const [error, setError] = useState("");
  const recognition = useRef<Recognition | null>(null);
  const call = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(true);
  const callbacks = useRef({ onDictation, onVoiceMessage });
  callbacks.current = { onDictation, onVoiceMessage };
  const stop = useCallback(() => {
    call.current = false;
    setCalling(false);
    if (timer.current) clearTimeout(timer.current);
    if (recognition.current) {
      recognition.current.onend = null;
      recognition.current.onresult = null;
      recognition.current.abort();
      recognition.current = null;
    }
    window.speechSynthesis?.cancel();
    setStatus("idle");
  }, []);
  const listen = useRef<() => void>(() => {});
  listen.current = () => {
    if (!Constructor || !enabled || !mounted.current) return;
    const rec = new Constructor();
    recognition.current = rec;
    rec.lang = navigator.language || "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    let handled = false;
    rec.onresult = (event) => {
      const result = event.results[0];
      if (result.isFinal === false) return;
      const text = result[0].transcript.trim();
      if (!text) return;
      handled = true;
      rec.stop();
      if (!call.current) {
        callbacks.current.onDictation(text);
        setStatus("idle");
        return;
      }
      setStatus("answering");
      void callbacks.current
        .onVoiceMessage(text)
        .then((reply) => {
          if (!mounted.current || !call.current) return;
          if (!reply) {
            stop();
            return;
          }
          const utterance = new SpeechSynthesisUtterance(reply);
          utterance.lang = navigator.language || "en-US";
          utterance.onend = () => {
            if (call.current && mounted.current)
              timer.current = setTimeout(() => listen.current(), 200);
          };
          utterance.onerror = () => {
            stop();
            setError("Voice playback stopped. You can continue by text.");
          };
          setStatus("speaking");
          window.speechSynthesis.speak(utterance);
        })
        .catch(() => {
          if (mounted.current) {
            stop();
            setError("Voice conversation stopped. Please try again.");
          }
        });
    };
    rec.onerror = () => {
      if (!mounted.current) return;
      stop();
      setError(
        "Microphone access or speech recognition is unavailable. You can continue by text.",
      );
    };
    rec.onend = () => {
      if (!mounted.current) return;
      if (call.current && !handled)
        timer.current = setTimeout(() => listen.current(), 200);
      else if (!handled) setStatus("idle");
    };
    try {
      setStatus("listening");
      rec.start();
    } catch {
      stop();
      setError("Couldn’t start speech recognition. Please try again.");
    }
  };
  const dictate = () => {
    stop();
    setError("");
    listen.current();
  };
  const startCall = () => {
    stop();
    if (!callSupported) return;
    setError("");
    call.current = true;
    setCalling(true);
    listen.current();
  };
  useEffect(() => {
    if (!enabled) stop();
  }, [enabled, stop]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      call.current = false;
      if (timer.current) clearTimeout(timer.current);
      if (recognition.current) {
        recognition.current.onend = null;
        recognition.current.onresult = null;
        recognition.current.abort();
      }
      window.speechSynthesis?.cancel();
    };
  }, []);
  return {
    supported,
    callSupported,
    status,
    calling,
    error,
    dictate,
    startCall,
    stop,
  };
}
