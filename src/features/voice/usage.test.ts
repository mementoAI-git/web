import { beforeEach, describe, expect, it, vi } from "vitest";
import { postJsonQuiet } from "@/api/fetcher";
import endpoint from "@/api/endpoint";
import { callTicketFrom, sendVoiceUsageCheckIn, VoiceQuietClock } from "./usage";

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
