import { useCallback, useEffect, useRef, useState } from "react";
import { pickVoicePreviewClip } from "@/lib/voice-preview-clips";

/**
 * Plays prerecorded voice samples through one audio element. Reusing it matters
 * on iOS, where an element that has played from a tap may keep playing later.
 */
export function useVoicePreviewClip() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastClipRef = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);

  const stop = useCallback(() => audioRef.current?.pause(), []);

  const play = useCallback((voiceId: string) => {
    audioRef.current?.pause();
    const clip = pickVoicePreviewClip(voiceId, lastClipRef.current);
    if (!clip) return;
    lastClipRef.current = clip;
    audioRef.current ??= new Audio();
    audioRef.current.src = clip;
    setFailed(false);
    void audioRef.current.play().catch((error: unknown) => {
      // AbortError only means the next voice took over before this one started.
      if (!(error instanceof DOMException && error.name === "AbortError")) setFailed(true);
    });
  }, []);

  useEffect(() => stop, [stop]);

  return { play, stop, failed };
}
