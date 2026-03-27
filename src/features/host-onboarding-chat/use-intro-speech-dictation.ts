import { useCallback, useEffect, useRef, useState } from "react";

function getSpeechRecognitionCtor():
  | (new () => SpeechRecognition)
  | undefined {
  if (typeof window === "undefined") return undefined;
  return (
    window.SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition })
      .webkitSpeechRecognition
  );
}

/**
 * Web Speech API dictation for the host onboarding intro composer.
 * Appends final phrases to the draft so the user can edit before sending.
 */
export function useIntroSpeechDictation(
  onFinalTranscript: (text: string) => void,
  active: boolean
) {
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  onFinalTranscriptRef.current = onFinalTranscript;

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);

  const stopListening = useCallback(() => {
    const r = recognitionRef.current;
    recognitionRef.current = null;
    if (r) {
      try {
        r.stop();
      } catch {
        /* already stopped */
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor || !active) return;

    stopListening();

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang =
      typeof navigator !== "undefined" && navigator.language
        ? navigator.language
        : "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let addition = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const row = event.results[i];
        if (row.isFinal) {
          addition += row[0]?.transcript ?? "";
        }
      }
      const t = addition.trim();
      if (t) onFinalTranscriptRef.current(t);
    };

    recognition.onerror = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, [active, stopListening]);

  const toggleListening = useCallback(() => {
    if (recognitionRef.current) stopListening();
    else startListening();
  }, [startListening, stopListening]);

  useEffect(() => {
    if (!active) stopListening();
  }, [active, stopListening]);

  useEffect(() => () => stopListening(), [stopListening]);

  const isSupported = getSpeechRecognitionCtor() !== undefined;

  return {
    isSupported,
    isListening,
    startListening,
    stopListening,
    toggleListening,
  };
}
