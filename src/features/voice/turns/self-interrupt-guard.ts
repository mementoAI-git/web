/**
 * Notices when Memento keeps interrupting itself because the mic hears its
 * voice (loud laptop speakers can beat the browser's echo cancellation), and
 * asks the call to stop listening while Memento talks, for a while. The host
 * can still talk whenever Memento is quiet. A degraded call beats an unusable
 * one, but not for the whole call: after VOICE_FALLBACK_MS the caller checks
 * the echo and restores listening, and each further fallback lasts twice as
 * long.
 *
 * The signal is what Gemini heard, not how loud it was. After an interruption,
 * if the words Gemini transcribed as the host are mostly Memento's own recent
 * words, or nothing at all, Memento heard itself. A real interruption ("wait",
 * "actually it was my aunt") uses the host's own words. The judgement waits
 * until Memento starts answering, so the host can finish speaking first.
 *
 * An interruption within VOICE_ONSET_INTERRUPT_MS of Memento starting to talk
 * is judged at once: nobody reacts that fast, and distorted echo often
 * transcribes as different words, so the words cannot be trusted for it.
 *
 * Mirrors mobile's features/chat/voice-self-interrupt-guard.ts.
 */

/** Suspected self-interruptions before falling back. */
export const VOICE_SELF_INTERRUPT_LIMIT = 1;
/** An interruption this soon after Memento became audible is its own echo. */
export const VOICE_ONSET_INTERRUPT_MS = 400;
/** Leftover echo must fall to this share of its level when the fallback began. */
export const VOICE_RESTORE_ECHO_RATIO = 0.3;
/** Below this, leftover echo is too faint to trigger anything. */
export const VOICE_RESTORE_ECHO_FLOOR = 0.01;
/** Seconds of Memento's speech to measure before trusting a low echo reading. */
export const VOICE_RESTORE_MIN_MEASURED_S = 1;
/** How far back Memento's words count as a possible echo. */
export const VOICE_ECHO_MEMORY_MS = 15_000;
/** Share of the heard words that must be Memento's own. */
export const VOICE_ECHO_WORD_OVERLAP = 0.6;
/** First fallback; each later one doubles, up to VOICE_FALLBACK_MAX_MS. */
export const VOICE_FALLBACK_MS = 30_000;
export const VOICE_FALLBACK_MAX_MS = 120_000;
/** When the echo is still too loud to restore, look again after this long. */
export const VOICE_FALLBACK_RECHECK_MS = 15_000;

/** Whether the echo has dropped enough to listen while Memento talks again. */
export function shouldRestore(levelAtFallback: number, levelNow: number, measuredSeconds: number): boolean {
  if (measuredSeconds < VOICE_RESTORE_MIN_MEASURED_S) return false;
  return levelNow <= VOICE_RESTORE_ECHO_FLOOR || levelNow <= levelAtFallback * VOICE_RESTORE_ECHO_RATIO;
}

/**
 * The mic's level while Memento is audible: the echo the browser's echo
 * cancellation let through. Measured whether or not the mic is being sent.
 */
export class PlaybackEchoMeter {
  level = 0;
  /** Seconds of Memento's speech measured since startMeasuring. */
  measuredSeconds = 0;
  private measured = false;

  observe(rms: number, frameMs: number, aiSpeaking: boolean): void {
    if (!aiSpeaking) return;
    // About a second of smoothing at 256 ms frames.
    this.level = this.measured ? this.level * 0.8 + rms * 0.2 : rms;
    this.measured = true;
    this.measuredSeconds += frameMs / 1_000;
  }

  startMeasuring(): void {
    this.measuredSeconds = 0;
  }
}

type Options = {
  now: () => number;
  /** Fall back now; call restore() after `durationMs`. */
  onFallback: (durationMs: number) => void;
  limit?: number;
};

function words(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? [];
}

export class VoiceSelfInterruptGuard {
  private spoken: { at: number; words: string[] }[] = [];
  private pending?: { heard: string };
  private readonly limit: number;
  private readonly options: Options;
  suspected = 0;
  fellBack = false;
  /** Times this call fell back. */
  fallbacks = 0;
  /** Interruptions within VOICE_ONSET_INTERRUPT_MS of Memento starting to talk. */
  onsetInterruptions = 0;
  /** Suspects since the last restore. */
  private sinceRestore = 0;

  constructor(options: Options) {
    this.options = options;
    this.limit = options.limit ?? VOICE_SELF_INTERRUPT_LIMIT;
  }

  observeOutputText(text: string): void {
    const found = words(text);
    if (found.length) this.spoken.push({ at: this.options.now(), words: found });
  }

  /**
   * `listeningWhileTalking`: the mic was being sent while Memento talked.
   * `audibleForMs`: how long Memento had been audible when cut off.
   */
  observeInterrupted(listeningWhileTalking: boolean, audibleForMs?: number): void {
    this.judge();
    if (!listeningWhileTalking || this.fellBack) return;
    if (audibleForMs !== undefined && audibleForMs < VOICE_ONSET_INTERRUPT_MS) {
      this.onsetInterruptions += 1;
      this.suspect();
      return;
    }
    this.pending = { heard: "" };
  }

  /** What Gemini transcribed as the host. */
  observeInputText(text: string): void {
    if (this.pending) this.pending.heard += text;
  }

  /** Memento started answering what it heard. */
  observeModelAudio(): void {
    this.judge();
  }

  private judge(): void {
    const pending = this.pending;
    if (!pending) return;
    this.pending = undefined;

    const heard = words(pending.heard);
    const cutoff = this.options.now() - VOICE_ECHO_MEMORY_MS;
    this.spoken = this.spoken.filter(entry => entry.at >= cutoff);
    const recent = new Set(this.spoken.flatMap(entry => entry.words));
    const own = heard.filter(word => recent.has(word)).length;
    const echo = heard.length === 0 || own / heard.length >= VOICE_ECHO_WORD_OVERLAP;
    if (echo) this.suspect();
  }

  private suspect(): void {
    this.suspected += 1;
    this.sinceRestore += 1;
    if (this.sinceRestore >= this.limit && !this.fellBack) {
      this.fellBack = true;
      this.fallbacks += 1;
      this.options.onFallback(Math.min(VOICE_FALLBACK_MS * 2 ** (this.fallbacks - 1), VOICE_FALLBACK_MAX_MS));
    }
  }

  /** Listening while Memento talks is back on: start counting afresh. */
  restore(): void {
    this.fellBack = false;
    this.sinceRestore = 0;
    this.pending = undefined;
  }
}
