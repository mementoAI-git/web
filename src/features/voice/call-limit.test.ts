import { describe, expect, it } from "vitest";
import {
  CALL_TIME_UP_MESSAGE,
  FREE_MINUTES_UP_MESSAGE,
  callLimitSchedule,
  callLimitWording,
  isCallTimeUp,
  isFreeVoiceMinutesUp,
  parseVoiceCallTime,
} from "./call-limit";
import { voiceTokenParams } from "./tools/capabilities";

describe("voice call time limit", () => {
  it("reads the ticket and time left from the token response", () => {
    expect(parseVoiceCallTime({ call_ticket: "t1", call_seconds_left: 1800 })).toEqual({ ticket: "t1", secondsLeft: 1800, reason: "call" });
    expect(
      parseVoiceCallTime({ call_ticket: "t1", call_seconds_left: 600, call_limit_reason: "free_monthly" }),
    ).toEqual({ ticket: "t1", secondsLeft: 600, reason: "free_monthly" });
    expect(parseVoiceCallTime({ token: "x" })).toBeUndefined();
    expect(parseVoiceCallTime(undefined)).toBeUndefined();
  });

  it("warns two minutes before the end, and skips the warning when there is no time for it", () => {
    expect(callLimitSchedule(1800)).toEqual({ warnInMs: 1_680_000, endInMs: 1_800_000 });
    expect(callLimitSchedule(90)).toEqual({ warnInMs: null, endInMs: 90_000 });
  });

  it("sends the ticket back when reconnecting", () => {
    expect(voiceTokenParams({ tools: false, resumeHandle: "r1", callTicket: "t1", timeZone: null })).toEqual({
      resume_handle: "r1",
      call_ticket: "t1",
    });
  });

  it("recognises a reconnect refused because the time is up", () => {
    expect(isCallTimeUp({ httpStatus: 403, details: { reason: "voice_call_limit" } })).toBe(true);
    expect(isCallTimeUp({ httpStatus: 403, details: { reason: "subscription_required" } })).toBe(false);
    expect(isCallTimeUp({ httpStatus: 503 })).toBe(false);
  });

  it("tells free members their monthly minutes ran out, not that the call did", () => {
    expect(callLimitWording("free_monthly").message).toBe(FREE_MINUTES_UP_MESSAGE);
    expect(callLimitWording("call").message).toBe(CALL_TIME_UP_MESSAGE);
    expect(isFreeVoiceMinutesUp({ httpStatus: 402, details: { feature: "voice_mode" } })).toBe(true);
    expect(isFreeVoiceMinutesUp({ httpStatus: 402, details: { feature: "storage" } })).toBe(false);
    expect(isFreeVoiceMinutesUp({ httpStatus: 403, details: { reason: "voice_call_limit" } })).toBe(false);
  });
});
