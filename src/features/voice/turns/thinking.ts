/**
 * Whether Memento is working on a reply the host is waiting for: Gemini heard
 * the host (its transcript arrived), the host has gone quiet, and no reply
 * audio has arrived yet (or a tool is running). The call screen shows
 * "Thinking…" then, instead of "Listening".
 *
 * Only Gemini's transcript turns it on, never mic level alone: on real
 * recordings, room sounds that Gemini ignored looked exactly like soft speech
 * by level, and showed "Thinking" while nobody had spoken. The mic still says
 * whether the host is mid-sentence, and feeds hybrid end of turn
 * (quietForMs), which has to act before Gemini's transcript exists.
 *
 * Mirrors mobile's features/chat/voice-thinking.ts, counting speech in
 * milliseconds because web's mic frames (256 ms) are longer than mobile's.
 */

/** Quiet this long after the host's last speech before showing Thinking. */
export const VOICE_THINKING_QUIET_MS = 400;
/** Give up showing Thinking if no reply arrives within this long. */
export const VOICE_THINKING_MAX_MS = 8_000;
/** Mic level (RMS 0..1) counted as the host speaking. */
export const VOICE_THINKING_SPEECH_RMS = 0.012;
/** Speech further apart than this (or 1.5 mic frames, if longer) does not add up. */
export const VOICE_THINKING_SPEECH_GAP_MS = 300;
/** Speech that counts as the host having said something; a click is too short. */
export const VOICE_THINKING_MIN_SPEECH_MS = 240;

/** Mic level of a frame, for the trackers. */
export function frameLevel(samples: Float32Array): number {
  if (!samples.length) return 0;
  let sum = 0;
  for (const sample of samples) sum += sample * sample;
  return Math.sqrt(sum / samples.length);
}

export class VoiceThinkingTracker {
  /** Gemini transcribed the host this turn. */
  private heardUser = false;
  /** The mic picked up sustained speech-level sound this turn. */
  private heardSpeech = false;
  private speechMs = 0;
  private lastSpeechAt = 0;
  private toolRunning = false;
  private waitingSince = 0;
  private readonly now: () => number;

  constructor(now: () => number = Date.now) {
    this.now = now;
  }

  /** Each mic frame sent to Gemini, with its level and length. */
  observeMic(rms: number, frameMs: number): void {
    if (rms < VOICE_THINKING_SPEECH_RMS) return;
    const at = this.now();
    const gap = Math.max(VOICE_THINKING_SPEECH_GAP_MS, frameMs * 1.5);
    if (!this.heardSpeech && at - this.lastSpeechAt > gap) this.speechMs = 0;
    this.lastSpeechAt = at;
    this.waitingSince = 0;
    this.speechMs += frameMs;
    if (this.speechMs >= VOICE_THINKING_MIN_SPEECH_MS) this.heardSpeech = true;
  }

  /** How long the host has been quiet since they last spoke; undefined if not heard this turn. */
  quietForMs(): number | undefined {
    return this.heardSpeech || this.heardUser ? this.now() - this.lastSpeechAt : undefined;
  }

  /** When the mic last picked up speech-level sound (0 if never). */
  lastSpokeAt(): number {
    return this.lastSpeechAt;
  }

  /**
   * Gemini transcribed something the host said. It often arrives after the
   * host stopped, so it does not move lastSpeechAt: the mic says when they
   * last spoke.
   */
  observeUserTranscript(): void {
    this.heardUser = true;
    this.waitingSince = 0;
  }

  observeToolCall(): void {
    this.toolRunning = true;
    this.waitingSince ||= this.now();
  }

  /** Reply audio arrived, the turn ended, or it was interrupted. */
  reset(): void {
    this.heardUser = false;
    this.heardSpeech = false;
    this.speechMs = 0;
    this.toolRunning = false;
    this.waitingSince = 0;
  }

  isThinking(aiSpeaking: boolean): boolean {
    if (aiSpeaking) return false;
    const at = this.now();
    if (!this.toolRunning) {
      if (!this.heardUser || at - this.lastSpeechAt < VOICE_THINKING_QUIET_MS) return false;
    }
    this.waitingSince ||= at;
    if (at - this.waitingSince > VOICE_THINKING_MAX_MS) {
      this.reset();
      return false;
    }
    return true;
  }
}
