/**
 * Recording a voice conversation with Memento, as the mobile app does
 * (mobile: src/features/chat/call-recording.ts). The browser mixes what the
 * host heard from Memento with their microphone into one file; this side
 * measures when someone was audible, notes when each transcript turn started
 * on the recording's clock, and turns that into timed, speaker-labelled
 * segments for the transcript player.
 */

export type RecordingSpeaker = "user" | "ai";

export type RecordingSegment = {
  /** Seconds from the start of the recording. */
  start: number;
  end: number;
  text: string;
  speaker: RecordingSpeaker;
};

export type RecordingTurn = { role: RecordingSpeaker; text: string };

/** A stretch of the recording where someone was audible, in seconds. */
export type SpeechSpan = { start: number; end: number };

/** Length of one character of the activity map. */
export const ACTIVITY_WINDOW_MS = 100;
/** About -36 dBFS, the native recorder's threshold, so both platforms mark speech alike. */
export const ACTIVITY_RMS_THRESHOLD = 0.015;
/** Pauses shorter than this inside speech stay part of it (breaths, gaps between words). */
const SPEECH_GAP_BRIDGE_MS = 400;
/** Blips shorter than this (a click, a cough) are not speech. */
const SPEECH_MIN_MS = 200;

/**
 * Speech recognition reports the host's words a little after they start
 * speaking, so their turns are moved back by about this much.
 */
export const USER_TRANSCRIPT_LAG_MS = 800;

/** Turns the activity map ('1' audible, '0' silence per 100 ms) into speech spans. */
export function speechSpansFromActivity(activity: string | undefined): SpeechSpan[] {
  if (!activity) return [];
  const raw: Array<[number, number]> = [];
  let runStart = -1;
  for (let i = 0; i <= activity.length; i += 1) {
    const on = activity[i] === "1";
    if (on && runStart < 0) runStart = i;
    if (!on && runStart >= 0) {
      raw.push([runStart * ACTIVITY_WINDOW_MS, i * ACTIVITY_WINDOW_MS]);
      runStart = -1;
    }
  }
  const merged: Array<[number, number]> = [];
  for (const span of raw) {
    const last = merged[merged.length - 1];
    if (last && span[0] - last[1] < SPEECH_GAP_BRIDGE_MS) last[1] = span[1];
    else merged.push([...span]);
  }
  return merged
    .filter(([start, end]) => end - start >= SPEECH_MIN_MS)
    .map(([start, end]) => ({ start: start / 1000, end: end / 1000 }));
}

/**
 * Timed segments for the transcript: each turn starts where it was first seen
 * (or right after the previous turn when it never was), and ends where the
 * next one starts, so the timeline has no overlaps and covers the recording.
 */
export function buildRecordingSegments(
  turns: RecordingTurn[],
  startsMs: ReadonlyMap<number, number>,
  durationMs: number,
): RecordingSegment[] {
  const total = Math.max(0, durationMs);
  const starts: number[] = [];
  let previous = 0;
  turns.forEach((_, index) => {
    const seen = startsMs.get(index);
    const start = Math.min(total, Math.max(previous, seen ?? previous));
    starts.push(start);
    previous = start;
  });
  const segments: RecordingSegment[] = [];
  turns.forEach((turn, index) => {
    const text = turn.text.trim();
    if (!text) return;
    const start = starts[index];
    const end = Math.max(start, index + 1 < starts.length ? starts[index + 1] : total);
    segments.push({
      start: round(start / 1000),
      end: round(end / 1000),
      text,
      speaker: turn.role,
    });
  });
  return segments;
}

function round(seconds: number) {
  return Math.round(seconds * 100) / 100;
}

/**
 * The recording's clock and speech map, fed the mixed audio as it is recorded.
 * Counting samples keeps it on the audio clock, so it stays right in a
 * background tab where timers are throttled.
 */
export class ActivityMeter {
  private frames = 0;
  private windowFrames = 0;
  private windowSquares = 0;
  private map = "";
  private readonly framesPerWindow: number;
  private readonly sampleRate: number;

  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
    this.framesPerWindow = Math.max(1, Math.round((sampleRate * ACTIVITY_WINDOW_MS) / 1000));
  }

  push(samples: Float32Array) {
    for (let i = 0; i < samples.length; i += 1) {
      this.windowSquares += samples[i] * samples[i];
      this.windowFrames += 1;
      if (this.windowFrames === this.framesPerWindow) this.closeWindow();
    }
    this.frames += samples.length;
  }

  private closeWindow() {
    const rms = Math.sqrt(this.windowSquares / Math.max(1, this.windowFrames));
    this.map += rms >= ACTIVITY_RMS_THRESHOLD ? "1" : "0";
    this.windowFrames = 0;
    this.windowSquares = 0;
  }

  /** Milliseconds recorded so far. */
  get elapsedMs() {
    return (this.frames / this.sampleRate) * 1000;
  }

  /** One character per finished 100 ms window. */
  get activity() {
    return this.map;
  }
}

/**
 * The call's transcript on the recording's clock. Live transcription arrives
 * in fragments per role; a role's first fragment after a turn ends starts a
 * new turn, timed when it was first heard.
 */
export class RecordingTranscript {
  private readonly turns: Array<RecordingTurn & { startMs: number }> = [];
  private open: Partial<Record<RecordingSpeaker, number>> = {};
  private readonly clockMs: () => number;

  constructor(clockMs: () => number) {
    this.clockMs = clockMs;
  }

  heard(role: RecordingSpeaker, text: string | undefined) {
    if (!text) return;
    let index = this.open[role];
    if (index === undefined) {
      const now = this.clockMs();
      const startMs = role === "user" ? Math.max(0, now - USER_TRANSCRIPT_LAG_MS) : now;
      index = this.turns.push({ role, text: "", startMs }) - 1;
      this.open[role] = index;
    }
    this.turns[index].text += text;
  }

  /** The current turn is over (turn complete or interrupted). */
  endTurn() {
    this.open = {};
  }

  /** Timed segments over a recording `durationMs` long; empty when nothing was said. */
  segments(durationMs: number): RecordingSegment[] {
    const said = this.turns
      // Gemini marks background sound as <noise>; it is not part of the conversation.
      .filter((turn) => turn.text.trim() && !/<noise>/.test(turn.text))
      .sort((a, b) => a.startMs - b.startMs);
    return buildRecordingSegments(
      said.map(({ role, text }) => ({ role, text })),
      new Map(said.map((turn, index) => [index, turn.startMs])),
      durationMs,
    );
  }
}
