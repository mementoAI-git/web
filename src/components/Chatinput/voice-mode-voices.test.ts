import { describe, expect, it } from "vitest";
import { formatVoiceSessionTime } from "./voice-mode-voices";

describe("formatVoiceSessionTime", () => {
  it("uses MM:SS below one hour", () => {
    expect(formatVoiceSessionTime(0)).toBe("00:00");
    expect(formatVoiceSessionTime(82)).toBe("01:22");
  });

  it("adds hours for longer sessions", () => {
    expect(formatVoiceSessionTime(3661)).toBe("01:01:01");
  });
});
