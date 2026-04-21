import type { SubscriptionSummary } from "./types";

/** Client fallback when billing API is unavailable or returns 404. */
export const DEFAULT_FREE_SUMMARY: SubscriptionSummary = {
  tier: "free",
  status: "active",
  features: [],
};
