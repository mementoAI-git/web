/**
 * Subscription / billing types aligned with docs/PRICING_BACKEND_HANDOFF.md and PRD §4.1.
 */

export type BillingProvider = "polar";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "paused";

export type PlanTier = "free" | "pro" | "legacy";

/** Usage snapshot when backend includes it on subscription or usage payload (PRD §4.2). */
export interface SubscriptionUsage {
  storage_used_bytes?: number;
  /** Bytes held by uploads that have started but are not committed yet. */
  storage_reserved_bytes?: number;
  /** When omitted, UI may fall back to tier defaults from PRD */
  storage_limit_bytes?: number;
  remaining_bytes?: number;
  percent_used?: number;
  over_limit?: boolean;
  beneficiary_count?: number;
  timed_message_count?: number;
  time_capsule_count?: number;
  memory_integration_count?: number;
}

/** Align `feature` strings with backend 402 payloads (PRD §3.3). */
export type FeatureKey =
  | "pro_plan"
  | "voice_mode"
  | "supermemory"
  | "upload_quality"
  | "storage"
  | "time_capsule_window"
  | "beneficiaries"
  | "timed_messages";

export interface SubscriptionSummary {
  tier: PlanTier;
  status: SubscriptionStatus;
  /** ISO 8601 end of current period */
  current_period_end?: string;
  /** ISO 8601 trial end (PRD: trial_ends_at) */
  trial_ends_at?: string;
  cancel_at_period_end?: boolean;
  provider?: BillingProvider;
  external_product_id?: string;
  /** Optional explicit feature grants (e.g. promos) */
  features?: FeatureKey[];
  currency?: "USD" | "NGN";
  country?: string;
  usage?: SubscriptionUsage;
}

export interface CheckoutRequestBody {
  success_url: string;
  cancel_url: string;
  /** When backend supports plan selection */
  tier?: PlanTier;
  interval?: "monthly" | "annual" | "lifetime";
}

export interface CheckoutResponseBody {
  checkout_url: string;
}

export interface PortalResponseBody {
  portal_url: string;
}

export interface BillingInvoice {
  id?: string;
  url?: string;
  label?: string;
  created_at?: string;
  amount?: number;
  currency?: "USD" | "NGN";
  status?: string;
}
