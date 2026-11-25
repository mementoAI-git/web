import { describe, expect, it } from "vitest";
import { describeFreeVoiceMinutes } from "./free-voice-minutes";

describe("describeFreeVoiceMinutes", () => {
  it("says plainly how many minutes are left, and what the monthly allowance is", () => {
    expect(describeFreeVoiceMinutes(5 * 60 + 30)).toBe(
      "You have 5 minutes of voice mode left this month. Free includes 90 minutes a month.",
    );
    expect(describeFreeVoiceMinutes(60)).toBe(
      "You have 1 minute of voice mode left this month. Free includes 90 minutes a month.",
    );
    expect(describeFreeVoiceMinutes(20)).toBe(
      "You have less than a minute of voice mode left this month. Free includes 90 minutes a month.",
    );
  });

  it("falls back to the allowance when the API doesn't say what's left", () => {
    expect(describeFreeVoiceMinutes(null)).toBe("Free includes 90 minutes of voice mode each month.");
  });
});
