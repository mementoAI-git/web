import { describe, expect, it } from "vitest";
import { parseHybridEndMs, VoiceHybridEnd } from "./hybrid-end";
import {
  PlaybackEchoMeter,
  shouldRestore,
  VOICE_FALLBACK_MAX_MS,
  VOICE_FALLBACK_MS,
  VOICE_ONSET_INTERRUPT_MS,
  VOICE_RESTORE_ECHO_FLOOR,
  VoiceSelfInterruptGuard,
} from "./self-interrupt-guard";

function guard() {
  const clock = { now: 0 };
  const durations: number[] = [];
  const g = new VoiceSelfInterruptGuard({ now: () => clock.now, onFallback: durationMs => durations.push(durationMs) });
  return { clock, durations, g };
}

// Memento says something, gets interrupted, Gemini transcribes what it heard,
// then Memento starts answering that.
function interruption(g: VoiceSelfInterruptGuard, said: string, heard: string, listening = true) {
  g.observeOutputText(said);
  g.observeInterrupted(listening);
  if (heard) g.observeInputText(heard);
  g.observeModelAudio();
}

describe("VoiceSelfInterruptGuard", () => {
  it("falls back the first time Memento interrupts itself with its own words", () => {
    const { g, durations } = guard();
    interruption(g, "So tell me about your grandmother", "tell me about");
    expect(durations).toEqual([VOICE_FALLBACK_MS]);
  });

  it("treats an interruption with nothing transcribed as echo or noise", () => {
    const { g, durations } = guard();
    interruption(g, "Tell me more", "");
    expect(durations).toHaveLength(1);
  });

  it("counts a cut-off right as Memento starts talking as echo, whatever was transcribed", () => {
    const { g, durations } = guard();
    g.observeOutputText("So tell me about your grandmother");
    g.observeInterrupted(true, VOICE_ONSET_INTERRUPT_MS - 1);
    g.observeInputText("actually it was my aunt");
    g.observeModelAudio();
    expect(durations).toHaveLength(1);
    expect(g.onsetInterruptions).toBe(1);
  });

  it("lets a real interruption through, even a short one", () => {
    const { g, durations } = guard();
    interruption(g, "So tell me about your grandmother", "wait");
    interruption(g, "Of course, take your time", "actually it was my aunt");
    g.observeOutputText("Your aunt, lovely");
    g.observeInterrupted(true, VOICE_ONSET_INTERRUPT_MS + 500);
    g.observeInputText("no stop");
    g.observeModelAudio();
    expect(durations).toHaveLength(0);
  });

  it("only judges interruptions while it was listening as Memento talked", () => {
    const { g, durations } = guard();
    interruption(g, "Tell me more", "tell me more", false);
    expect(durations).toHaveLength(0);
  });

  it("forgets Memento's words after a while", () => {
    const { g, clock, durations } = guard();
    g.observeOutputText("grandmother farm Lagos");
    clock.now = 20_000;
    interruption(g, "Something else entirely", "grandmother farm Lagos");
    expect(durations).toHaveLength(0);
  });

  it("falls back for longer each time, up to a limit", () => {
    const { g, durations } = guard();
    for (let i = 0; i < 4; i += 1) {
      interruption(g, "Tell me more", "tell me more");
      g.restore();
    }
    expect(durations).toEqual([VOICE_FALLBACK_MS, VOICE_FALLBACK_MS * 2, VOICE_FALLBACK_MAX_MS, VOICE_FALLBACK_MAX_MS]);
  });
});

describe("shouldRestore and PlaybackEchoMeter", () => {
  it("restores only once enough of Memento's speech shows the echo has dropped", () => {
    expect(shouldRestore(0.2, 0.05, 0.5)).toBe(false);
    expect(shouldRestore(0.2, 0.05, 2)).toBe(true);
    expect(shouldRestore(0.2, 0.15, 2)).toBe(false);
    expect(shouldRestore(0.02, VOICE_RESTORE_ECHO_FLOOR, 2)).toBe(true);
  });

  it("measures the mic only while Memento is audible", () => {
    const meter = new PlaybackEchoMeter();
    meter.observe(0.5, 256, false);
    expect(meter.measuredSeconds).toBe(0);
    meter.observe(0.2, 256, true);
    meter.observe(0.2, 256, true);
    expect(meter.level).toBeCloseTo(0.2);
    expect(meter.measuredSeconds).toBeCloseTo(0.512);
    meter.startMeasuring();
    expect(meter.measuredSeconds).toBe(0);
  });
});

describe("VoiceHybridEnd", () => {
  it("is off unless a delay is configured", () => {
    expect(parseHybridEndMs(undefined)).toBe(0);
    expect(parseHybridEndMs("abc")).toBe(0);
    expect(parseHybridEndMs("600")).toBe(600);
    expect(new VoiceHybridEnd(0).check(5_000, false)).toBe(false);
  });

  it("ends the turn once per pause, never while Memento talks", () => {
    const end = new VoiceHybridEnd(600);
    expect(end.check(undefined, false)).toBe(false);
    expect(end.check(500, false)).toBe(false);
    expect(end.check(700, true)).toBe(false);
    expect(end.check(700, false)).toBe(true);
    expect(end.check(900, false)).toBe(false);
    expect(end.check(100, false)).toBe(false);
    expect(end.check(700, false)).toBe(true);
  });
});
