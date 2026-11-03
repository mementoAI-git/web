import { describe, expect, it } from "vitest";
import { nextReconnectDelay, resumeHandleFrom, VOICE_RECONNECT_BUDGET_MS, VOICE_RECONNECT_DELAYS_MS } from "./connection";

describe("nextReconnectDelay", () => {
  it("tries at once, then backs off", () => {
    expect(VOICE_RECONNECT_DELAYS_MS.map((_, attempt) => nextReconnectDelay(attempt, 0))).toEqual([0, 500, 1_500, 3_000, 5_000]);
  });

  it("gives up after the last attempt or once the time budget is spent", () => {
    expect(nextReconnectDelay(VOICE_RECONNECT_DELAYS_MS.length, 0)).toBeNull();
    expect(nextReconnectDelay(4, VOICE_RECONNECT_BUDGET_MS - 1_000)).toBeNull();
  });
});

describe("resumeHandleFrom", () => {
  it("keeps a handle only when Gemini says the call can resume", () => {
    expect(resumeHandleFrom({ resumable: true, newHandle: "h" })).toBe("h");
    expect(resumeHandleFrom({ resumable: false, newHandle: "h" })).toBeUndefined();
    expect(resumeHandleFrom({ resumable: true, newHandle: "" })).toBeUndefined();
    expect(resumeHandleFrom(undefined)).toBeUndefined();
  });
});
