import { beforeEach, describe, expect, it, vi } from "vitest";
import { postJsonQuiet } from "@/api/fetcher";
import endpoint from "@/api/endpoint";
import { callTicketFrom, formatVoiceMinutes, parseVoiceUsage, sendVoiceUsageCheckIn, voiceMinutes, VoiceQuietClock } from "./usage";

vi.mock("@/api/fetcher", () => ({ postJsonQuiet: vi.fn().mockResolvedValue(true) }));

const MIN = 60_000;

describe("VoiceQuietClock", () => {
  it("counts nothing while people keep talking, including pauses under a minute", () => {
    const clock = new VoiceQuietClock(0);
    clock.activity(50_000);
    clock.activity(100_000);
    expect(clock.quietSeconds(150_000)).toBe(0);
  });

  it("frees only the part of a silence after its first minute", () => {
    const clock = new VoiceQuietClock(0);
    clock.activity(5 * MIN); // four quiet minutes after the first
    expect(clock.quietSeconds(5 * MIN)).toBe(240);
    // A silence still going on counts too, and the total only grows.
    expect(clock.quietSeconds(7 * MIN)).toBe(240 + 60);
    clock.activity(7 * MIN);
    expect(clock.quietSeconds(10 * MIN)).toBe(300 + 120);
  });
});

describe("voice usage check-ins", () => {
  beforeEach(() => vi.mocked(postJsonQuiet).mockClear());

  it("reads the call ticket from any voice token, limited or not", () => {
    expect(callTicketFrom({ token: "t", call_ticket: "123.sig" })).toBe("123.sig");
    expect(callTicketFrom({ token: "t" })).toBeNull();
  });

  it("checks in quietly as connected, with the call's long silences", async () => {
    await sendVoiceUsageCheckIn("123.sig", 90.7);
    expect(postJsonQuiet).toHaveBeenCalledWith(
      endpoint.voiceUsage,
      expect.objectContaining({ call_ticket: "123.sig", connected: true, quiet_seconds: 90 }),
    );
  });
});

describe("voice minutes", () => {
  it("reads this month, all time and the free allowance", () => {
    expect(
      parseVoiceUsage({
        month: "2026-11",
        month_seconds: 1830,
        all_time_seconds: 7290,
        month_resets_at: "2026-11-30T23:00:00.000Z",
        free_seconds_limit: 5400,
        free_seconds_left: 3570,
      }),
    ).toMatchObject({ monthSeconds: 1830, allTimeSeconds: 7290, freeLimitSeconds: 5400, freeLeftSeconds: 3570 });
    expect(parseVoiceUsage({ month_seconds: 0, all_time_seconds: 60, free_seconds_limit: null })).toMatchObject({
      freeLimitSeconds: null,
    });
    expect(parseVoiceUsage(null)).toBeNull();
  });

  it("shows whole minutes, rounded down, and hours from 60", () => {
    expect(voiceMinutes(119)).toBe(1);
    expect(formatVoiceMinutes(45 * 60 + 59)).toBe("45 min");
    expect(formatVoiceMinutes(3 * 3600 + 5 * 60)).toBe("3 h 5 min");
  });
});
