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
});
