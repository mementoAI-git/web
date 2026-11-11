/**
 * Pure helpers for the transcript audio player (the file preview"s audio slide).
 * Ported from the mobile app"s src/features/audio/transcript-player.ts; keep the two in step.
 */

export type TranscriptSpeaker = "user" | "ai";

export interface TranscriptSegment {
  /** Seconds from the start of the file. */
  start: number;
  end: number;
  text: string;
  speaker?: TranscriptSpeaker;
}

export interface FileTranscription {
  fullText: string;
  segments: TranscriptSegment[];
  /** When someone was audible (recorded voice conversations); the rest is silence. */
  speech: { start: number; end: number }[];
}

export interface TranscriptTurn {
  id: string;
  speaker?: TranscriptSpeaker;
  start: number;
  end: number;
  text: string;
  /** The segments merged into this turn, in order. */
  parts: { start: number; end: number; text: string }[];
}

export interface TimelineBlock {
  key: string;
  /** Fraction of the track (0–1) where the block starts. */
  left: number;
  /** Fraction of the track (0–1) the block covers. */
  width: number;
  speaker?: TranscriptSpeaker;
}

export const SKIP_SECONDS = 5;

function toFiniteNumber(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

/** Normalises the `/ai/transcribe-audio` payload into sorted, valid segments. */
export function parseFileTranscription(data: unknown): FileTranscription | null {
  if (!data || typeof data !== "object") return null;
  const raw = data as { full_text?: unknown; segments?: unknown; speech?: unknown };
  const rawSegments = Array.isArray(raw.segments) ? raw.segments : [];
  const segments: TranscriptSegment[] = [];
  for (const entry of rawSegments) {
    if (!entry || typeof entry !== "object") continue;
    const s = entry as Record<string, unknown>;
    const start = toFiniteNumber(s.start);
    const end = toFiniteNumber(s.end);
    const text = typeof s.text === "string" ? s.text.trim() : "";
    if (start === null || !text) continue;
    const safeStart = Math.max(0, start);
    const safeEnd = end === null ? safeStart : Math.max(safeStart, end);
    const speaker = s.speaker === "user" || s.speaker === "ai" ? s.speaker : undefined;
    segments.push(speaker ? { start: safeStart, end: safeEnd, text, speaker } : { start: safeStart, end: safeEnd, text });
  }
  segments.sort((a, b) => a.start - b.start);
  const speech = (Array.isArray(raw.speech) ? raw.speech : []).flatMap((entry) => {
    const s = (entry ?? {}) as Record<string, unknown>;
    const start = toFiniteNumber(s.start);
    const end = toFiniteNumber(s.end);
    return start !== null && end !== null && end > start ? [{ start: Math.max(0, start), end }] : [];
  });
  const fullText = typeof raw.full_text === "string" ? raw.full_text.trim() : "";
  if (!segments.length && !fullText) return null;
  return { fullText, segments, speech };
}

export function hasSpeakers(segments: readonly TranscriptSegment[]): boolean {
  return segments.some((segment) => Boolean(segment.speaker));
}

/**
 * Index of the last item whose start is at or before `time` (binary search).
 * Returns -1 before the first item. Items must be sorted by start.
 */
export function findActiveIndex(items: readonly { start: number }[], time: number): number {
  if (!items.length || !Number.isFinite(time) || time < items[0].start) return -1;
  let lo = 0;
  let hi = items.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (items[mid].start <= time) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/**
 * Groups consecutive segments of the same speaker into one turn. Single-speaker
 * voice notes (no speaker) keep each segment as its own turn so the highlight
 * still moves sentence by sentence.
 */
export function mergeTranscriptTurns(segments: readonly TranscriptSegment[]): TranscriptTurn[] {
  const turns: TranscriptTurn[] = [];
  for (const segment of segments) {
    const last = turns[turns.length - 1];
    if (last && segment.speaker && last.speaker === segment.speaker) {
      last.end = Math.max(last.end, segment.end);
      last.text = `${last.text} ${segment.text}`;
      last.parts.push({ start: segment.start, end: segment.end, text: segment.text });
      continue;
    }
    turns.push({
      id: `turn-${turns.length}-${segment.start}`,
      speaker: segment.speaker,
      start: segment.start,
      end: segment.end,
      text: segment.text,
      parts: [{ start: segment.start, end: segment.end, text: segment.text }],
    });
  }
  return turns;
}

export type SpeechSpanSeconds = { start: number; end: number };

/** Seconds inside [from, to] when someone was audible. */
function audibleBetween(speech: readonly SpeechSpanSeconds[], from: number, to: number): number {
  let total = 0;
  for (const span of speech) {
    if (span.start >= to) break;
    total += Math.max(0, Math.min(to, span.end) - Math.max(from, span.start));
  }
  return total;
}

/**
 * How far through a part playback is (0–1). With speech spans, only audible
 * time counts, so pauses and the silence before the next turn don't slow the
 * words down; without them, the part's time is spread evenly.
 */
function partProgress(part: { start: number; end: number }, time: number, speech?: readonly SpeechSpanSeconds[]): number {
  if (speech?.length) {
    const audible = audibleBetween(speech, part.start, part.end);
    if (audible > 0) return audibleBetween(speech, part.start, Math.min(time, part.end)) / audible;
  }
  const span = part.end - part.start;
  return span > 0 ? (time - part.start) / span : 1;
}

/**
 * How many characters of `turn.text` have been spoken at `time`. Finished
 * segments count in full; the segment being spoken reveals whole words as its
 * speech plays, so the highlight streams word by word with the voice.
 */
export function spokenCharCount(turn: TranscriptTurn, time: number, speech?: readonly SpeechSpanSeconds[]): number {
  if (!Number.isFinite(time) || time < turn.start) return 0;
  let count = 0;
  for (let i = 0; i < turn.parts.length; i += 1) {
    const part = turn.parts[i];
    const separator = i < turn.parts.length - 1 ? 1 : 0;
    if (time >= part.end) {
      count += part.text.length + separator;
      continue;
    }
    if (time < part.start) break;
    const fraction = Math.min(1, Math.max(0, partProgress(part, time, speech)));
    const words = part.text.split(/(\s+)/);
    const wordCount = words.filter((w) => w && !/^\s+$/.test(w)).length;
    // A word lights up once it is about half said.
    let reveal = Math.round(wordCount * fraction);
    for (const piece of words) {
      if (reveal <= 0) break;
      count += piece.length;
      if (piece && !/^\s+$/.test(piece)) reveal -= 1;
    }
    break;
  }
  return Math.min(turn.text.length, count);
}

/** How far a turn's start may move to meet the speech that begins it. */
const SPEECH_SNAP_SECONDS = 1.5;

/**
 * Turn starts come from when live transcription first showed the words, which
 * can be a little before or after the voice. Each turn starts where the nearest
 * stretch of speech begins, if one begins close by, so the highlight and
 * click-to-play land on the first word. Starts never move past each other.
 */
export function alignTurnsToSpeech(turns: readonly TranscriptTurn[], speech: readonly SpeechSpanSeconds[]): TranscriptTurn[] {
  if (!speech.length) return [...turns];
  let previous = -Infinity;
  return turns.map((turn, index) => {
    const nextStart = turns[index + 1]?.start ?? Infinity;
    let best: number | null = null;
    for (const span of speech) {
      if (span.start > turn.start + SPEECH_SNAP_SECONDS) break;
      if (span.start < turn.start - SPEECH_SNAP_SECONDS) continue;
      if (span.start <= previous || span.start >= nextStart) continue;
      if (best === null || Math.abs(span.start - turn.start) < Math.abs(best - turn.start)) best = span.start;
    }
    const start = best ?? Math.max(turn.start, previous);
    previous = start;
    if (start === turn.start) return turn;
    const shift = start - turn.start;
    return {
      ...turn,
      start,
      // The first part moves with the turn; the rest keep their own times.
      parts: turn.parts.map((part, partIndex) =>
        partIndex === 0 ? { ...part, start: Math.min(part.end, part.start + shift) } : part),
    };
  });
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Speaker-coloured blocks along the timeline, as track fractions. */
export function computeTimelineBlocks<T extends { start: number; end: number; speaker?: TranscriptSpeaker }>(
  segments: readonly T[],
  duration: number,
): TimelineBlock[] {
  if (!Number.isFinite(duration) || duration <= 0) return [];
  const blocks: TimelineBlock[] = [];
  segments.forEach((segment, index) => {
    const left = clamp01(segment.start / duration);
    const right = clamp01(segment.end / duration);
    const width = right - left;
    if (width <= 0) return;
    blocks.push({ key: `block-${index}`, left, width, speaker: segment.speaker });
  });
  return blocks;
}

/** Duration to lay the timeline out against: the player"s, else the transcript"s end. */
export function resolveTimelineDuration(playerDuration: number, segments: readonly TranscriptSegment[]): number {
  if (Number.isFinite(playerDuration) && playerDuration > 0) return playerDuration;
  return segments.reduce((max, segment) => Math.max(max, segment.end), 0);
}

/** `mm:ss`, or `h:mm:ss` past an hour. */
export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = s.toString().padStart(2, "0");
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${ss}`;
  return `${m.toString().padStart(2, "0")}:${ss}`;
}

/** `-mm:ss` remaining; elapsed + remaining always adds up to the whole-second duration. */
export function formatRemaining(currentTime: number, duration: number): string {
  const safeDuration = Number.isFinite(duration) ? Math.max(0, Math.floor(duration)) : 0;
  const safeCurrent = Number.isFinite(currentTime) ? Math.max(0, Math.floor(currentTime)) : 0;
  return `-${formatClock(Math.max(0, safeDuration - safeCurrent))}`;
}

/** Skip target clamped to the file. Without a known duration only the lower bound applies. */
export function clampSkip(currentTime: number, delta: number, duration: number): number {
  const next = (Number.isFinite(currentTime) ? currentTime : 0) + delta;
  const upper = Number.isFinite(duration) && duration > 0 ? duration : Number.POSITIVE_INFINITY;
  return Math.min(upper, Math.max(0, next));
}

/** Seek fraction for a touch at `x` on a track `width` wide. */
export function fractionFromX(x: number, width: number): number {
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(x)) return 0;
  return clamp01(x / width);
}

export function speakerLabel(speaker?: TranscriptSpeaker): string | null {
  if (speaker === "user") return "You";
  if (speaker === "ai") return "Memento";
  return null;
}

const VOICE_FILE_NAME = /^voice_.*\.m4a$/i;

/** Voice notes and recorded conversations get a transcript; music does not. */
export function isVoiceRecording(attachment: { isVoice?: boolean; name?: string | null }): boolean {
  return Boolean(attachment.isVoice) || VOICE_FILE_NAME.test(attachment.name ?? "");
}
