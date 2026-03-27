import { describe, expect, it } from "vitest";
import {
  dayDividerLabel,
  formatJumpMonthLabel,
  monthKeysFromMessages,
} from "./month-navigation";

describe("monthKeysFromMessages", () => {
  it("returns unique YYYY-MM in message order", () => {
    const keys = monthKeysFromMessages([
      { created_at: "2024-01-15T10:00:00.000Z", role: "user", text: "a" },
      { created_at: "2024-01-20T10:00:00.000Z", role: "ai", text: "b" },
      { created_at: "2024-02-01T10:00:00.000Z", role: "user", text: "c" },
    ]);
    expect(keys).toEqual(["2024-01", "2024-02"]);
  });

  it("skips invalid or missing created_at", () => {
    expect(monthKeysFromMessages([{ role: "user", text: "x" }])).toEqual([]);
  });
});

describe("formatJumpMonthLabel", () => {
  it("formats YYYY-MM for display", () => {
    expect(formatJumpMonthLabel("2024-03")).toMatch(/Mar/);
    expect(formatJumpMonthLabel("2024-03")).toMatch(/2024/);
  });
});

describe("dayDividerLabel", () => {
  it("labels today", () => {
    const today = new Date().toISOString();
    expect(dayDividerLabel(today)).toBe("Today");
  });
});
