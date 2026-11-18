import type { FeatureKey, PlanTier, SubscriptionSummary } from "./types";

const PAID_TIERS: PlanTier[] = ["pro", "legacy"];

export function canAccessFeature(
  summary: SubscriptionSummary | null,
  feature: FeatureKey,
): boolean {
  if (!summary) return false;
  if (PAID_TIERS.includes(summary.tier)) return true;
  // Free members get monthly voice minutes; the API refuses once they are used.
  if (feature === "voice_mode" && (summary.usage?.voice_seconds_left ?? 0) > 0) return true;
  return summary.features?.includes(feature) ?? false;
}
