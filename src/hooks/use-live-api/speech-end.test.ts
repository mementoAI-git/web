import {describe, expect, it} from "vitest";
import {createSpeechEndDetector} from "./speech-end";

const frame = (level: number, milliseconds = 100) =>
  new Float32Array(milliseconds * 16).fill(level);

describe("client speech endpoint fallback", () => {
  it("does not finalize idle silence or steady background noise", () => {
    const detector = createSpeechEndDetector(16000);
    for (let i = 0; i < 50; i++) expect(detector.push(frame(0.02))).toBe(false);
  });

  it("flushes once after speech followed by a conservative pause, even with background noise", () => {
    const detector = createSpeechEndDetector(16000);
    detector.push(frame(0.02));
    detector.push(frame(0.12, 500));
    for (let i = 0; i < 11; i++) expect(detector.push(frame(0.02))).toBe(false);
    expect(detector.push(frame(0.02))).toBe(true);
    for (let i = 0; i < 20; i++) expect(detector.push(frame(0.02))).toBe(false);
    detector.push(frame(0.12, 500));
    expect(detector.push(frame(0.02, 1200))).toBe(true);
  });

  it("does not end a turn during a brief mid-sentence pause", () => {
    const detector = createSpeechEndDetector(16000);
    detector.push(frame(0));
    detector.push(frame(0.1, 500));
    expect(detector.push(frame(0, 1000))).toBe(false);
    detector.push(frame(0.1, 500));
    expect(detector.push(frame(0, 1000))).toBe(false);
    expect(detector.push(frame(0, 200))).toBe(true);
  });

  it("clears a pending turn when a session changes or the microphone is muted", () => {
    const detector = createSpeechEndDetector(16000);
    detector.push(frame(0));
    detector.push(frame(0.1, 500));
    detector.reset();
    expect(detector.push(frame(0, 2000))).toBe(false);
  });

  it("uses the actual sample rate and ignores short non-speech clicks", () => {
    const detector = createSpeechEndDetector(48000);
    detector.push(new Float32Array(4800));
    detector.push(new Float32Array(480).fill(0.5));
    expect(detector.push(new Float32Array(96000))).toBe(false);
    detector.push(new Float32Array(24000).fill(0.1));
    expect(detector.push(new Float32Array(48000))).toBe(false);
    expect(detector.push(new Float32Array(9600))).toBe(true);
  });
});
