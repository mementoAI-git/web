import { describe, it, expect } from "vitest";
import { formatProfileDobDisplay } from "./inline-profile-date-field";

describe("formatProfileDobDisplay", () => {
  it("formats valid ISO and date-only strings", () => {
    expect(formatProfileDobDisplay("1990-01-01")).toBe("January 1, 1990");
    expect(formatProfileDobDisplay("1990-01-01T00:00:00.000Z")).toContain("1990");
  });

  it("returns empty string for invalid or empty input", () => {
    expect(formatProfileDobDisplay("")).toBe("");
    expect(formatProfileDobDisplay("not-a-date")).toBe("");
  });
});
