import { describe, expect, it } from "vitest";

import { canAccessFeature } from "./can-access";
import { DEFAULT_FREE_SUMMARY } from "./default-free";
import type { SubscriptionSummary } from "./types";

describe("canAccessFeature", () => {
  it("denies when summary is null", () => {
    expect(canAccessFeature(null, "voice_mode")).toBe(false);
  });

  it("allows all launch gates for pro", () => {
    const s: SubscriptionSummary = { ...DEFAULT_FREE_SUMMARY, tier: "pro" };
    expect(canAccessFeature(s, "voice_mode")).toBe(true);
    expect(canAccessFeature(s, "supermemory")).toBe(true);
  });

  it("allows all launch gates for legacy", () => {
    const s: SubscriptionSummary = { ...DEFAULT_FREE_SUMMARY, tier: "legacy" };
    expect(canAccessFeature(s, "voice_mode")).toBe(true);
  });

  it("allows explicit feature grants on free", () => {
    const s: SubscriptionSummary = {
      ...DEFAULT_FREE_SUMMARY,
      features: ["voice_mode"],
    };
    expect(canAccessFeature(s, "voice_mode")).toBe(true);
    expect(canAccessFeature(s, "supermemory")).toBe(false);
  });

  it("allows voice mode on free while the month's voice minutes last", () => {
    const withMinutes: SubscriptionSummary = {
      ...DEFAULT_FREE_SUMMARY,
      usage: { voice_seconds_limit: 5400, voice_seconds_used: 600, voice_seconds_left: 4800 },
    };
    const usedUp: SubscriptionSummary = {
      ...DEFAULT_FREE_SUMMARY,
      usage: { voice_seconds_limit: 5400, voice_seconds_used: 5400, voice_seconds_left: 0 },
    };
    expect(canAccessFeature(withMinutes, "voice_mode")).toBe(true);
    expect(canAccessFeature(withMinutes, "supermemory")).toBe(false);
    expect(canAccessFeature(usedUp, "voice_mode")).toBe(false);
  });
});
