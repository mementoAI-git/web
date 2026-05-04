import type { FeatureKey, PlanTier, SubscriptionSummary } from "./types";

const PAID_TIERS: PlanTier[] = ["pro", "legacy"];

export function canAccessFeature(
  summary: SubscriptionSummary | null,
  feature: FeatureKey,
): boolean {
  if (!summary) return false;
  if (PAID_TIERS.includes(summary.tier)) return true;
  return summary.features?.includes(feature) ?? false;
}
