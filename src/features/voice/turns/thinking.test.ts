import { describe, expect, it } from "vitest";
import { frameLevel, VOICE_THINKING_MAX_MS, VOICE_THINKING_QUIET_MS, VoiceThinkingTracker } from "./thinking";

/** Web's mic frames: 4096 samples at 16 kHz. */
const FRAME_MS = 256;

function tracker() {
  let now = 1_000;
  const subject = new VoiceThinkingTracker(() => now);
  return { subject, advance: (ms: number) => (now += ms) };
}

describe("VoiceThinkingTracker", () => {
  it("is not thinking before the host has said anything", () => {
    const { subject, advance } = tracker();
    advance(2_000);
    expect(subject.isThinking(false)).toBe(false);
  });

  it("mic sound alone never shows Thinking, however long: only Gemini hearing the host does", () => {
    const { subject, advance } = tracker();
    for (let i = 0; i < 20; i += 1) {
      subject.observeMic(0.2, FRAME_MS);
      advance(FRAME_MS);
    }
    advance(VOICE_THINKING_QUIET_MS * 3);
    expect(subject.isThinking(false)).toBe(false);
  });

  it("shows once Gemini has heard the host and they have gone quiet", () => {
    const { subject, advance } = tracker();
    subject.observeMic(0.2, FRAME_MS);
    subject.observeUserTranscript();
    advance(VOICE_THINKING_QUIET_MS - 1);
    expect(subject.isThinking(false)).toBe(false);
    advance(1);
    expect(subject.isThinking(false)).toBe(true);
  });

  it("stops while the host keeps talking, and ignores quiet mic noise", () => {
    const { subject, advance } = tracker();
    subject.observeUserTranscript();
    advance(VOICE_THINKING_QUIET_MS);
    subject.observeMic(0.002, FRAME_MS);
    expect(subject.isThinking(false)).toBe(true);
    subject.observeMic(0.2, FRAME_MS);
    expect(subject.isThinking(false)).toBe(false);
  });

  it("counts one long web frame of speech as the host having spoken, for hybrid end of turn", () => {
    const { subject, advance } = tracker();
    subject.observeMic(0.05, FRAME_MS);
    advance(500);
    expect(subject.quietForMs()).toBe(500);
  });

  it("does not add up speech frames that are far apart", () => {
    const { subject, advance } = tracker();
    subject.observeMic(0.05, 100);
    advance(1_000);
    subject.observeMic(0.05, 100);
    expect(subject.quietForMs()).toBeUndefined();
  });

  it("never thinks while Memento is speaking, thinks at once while a tool runs, and gives up", () => {
    const { subject, advance } = tracker();
    subject.observeUserTranscript();
    advance(VOICE_THINKING_QUIET_MS);
    expect(subject.isThinking(true)).toBe(false);
    subject.reset();
    subject.observeToolCall();
    expect(subject.isThinking(false)).toBe(true);
    advance(VOICE_THINKING_MAX_MS + 1);
    expect(subject.isThinking(false)).toBe(false);
  });
});

describe("frameLevel", () => {
  it("is the frame's RMS level", () => {
    expect(frameLevel(new Float32Array([0.5, -0.5]))).toBeCloseTo(0.5);
    expect(frameLevel(new Float32Array())).toBe(0);
  });
});
