/**
 * Hybrid end of turn (Gemini Live "hybrid VAD"): Gemini still detects when
 * the host starts speaking, and web tells it the host has finished by
 * sending audioStreamEnd, which Gemini treats as "answer now" instead of
 * waiting out its own silence window (450 or 800 ms, set by the API).
 *
 * Off unless VITE_VOICE_HYBRID_END_MS is set, as on mobile
 * (EXPO_PUBLIC_VOICE_HYBRID_END_MS). Too short a delay cuts people off
 * mid-thought, so pick it from recordings and premature-reply rates, not by
 * feel. Web's mic frames are 256 ms, so the delay acts in steps of that size.
 * Gemini's own detection remains the fallback if this never fires.
 */

export function parseHybridEndMs(value: string | undefined): number {
  const ms = Number(value);
  return Number.isFinite(ms) && ms > 0 ? ms : 0;
}

export class VoiceHybridEnd {
  private sent = false;
  private readonly endMs: number;

  constructor(endMs: number) {
    this.endMs = endMs;
  }

  /**
   * Per mic frame. `quietMs`: how long the host has been quiet since they
   * last spoke, or undefined if nothing has been heard this turn. True means
   * send audioStreamEnd now; it is true once per pause.
   */
  check(quietMs: number | undefined, aiSpeaking: boolean): boolean {
    if (this.endMs <= 0 || aiSpeaking) return false;
    if (quietMs === undefined || quietMs < this.endMs) {
      this.sent = false;
      return false;
    }
    if (this.sent) return false;
    this.sent = true;
    return true;
  }
}
