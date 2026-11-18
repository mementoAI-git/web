/** Mirrors mobile/app/pricing.tsx and mobile/src/features/billing/iap-constants.ts. */
export type BillingInterval = "monthly" | "annual";

export const PRO_PRICES = { monthly: 9.99, annual: 79 } as const;
export const ANNUAL_SAVINGS_PERCENT = Math.round(
  (1 - PRO_PRICES.annual / (PRO_PRICES.monthly * 12)) * 100,
);

export const FREE_FEATURES = [
  "Add stories, journals, and thoughts",
  "Core chat and memories",
  "Memory insights",
  "Standard uploads and storage (200 MB)",
  "Voice mode (90 minutes a month)",
];
export const PRO_FEATURES = [
  "Everything in Free",
  "Unlimited voice mode conversations",
  "Supermemory integration",
  "Bigger storage (10 GB)",
];

export function formatPlanPrice(interval: BillingInterval) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(PRO_PRICES[interval]);
}
