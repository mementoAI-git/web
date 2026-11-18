import {
  normalizeCollectionResponse,
  normalizeEntityResponse,
} from "@/api/domain-adapters";
import { DEFAULT_FREE_SUMMARY } from "./default-free";
import type {
  BillingInvoice,
  SubscriptionSummary,
  SubscriptionUsage,
} from "./types";

function parseUsage(raw: unknown): SubscriptionUsage | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const source = raw as Record<string, unknown>;
  const usage: SubscriptionUsage = {};
  const numericKeys = [
    "storage_used_bytes",
    "storage_reserved_bytes",
    "storage_limit_bytes",
    "remaining_bytes",
    "percent_used",
    "beneficiary_count",
    "timed_message_count",
    "time_capsule_count",
    "memory_integration_count",
    "voice_seconds_limit",
    "voice_seconds_used",
    "voice_seconds_left",
  ] as const;

  for (const key of numericKeys) {
    if (typeof source[key] === "number") usage[key] = source[key];
  }
  if (typeof source.over_limit === "boolean")
    usage.over_limit = source.over_limit;
  if (typeof source.voice_allowance_resets_at === "string")
    usage.voice_allowance_resets_at = source.voice_allowance_resets_at;
  return Object.keys(usage).length ? usage : undefined;
}

export function normalizeSubscriptionSummary(
  payload: unknown,
): SubscriptionSummary {
  const raw = normalizeEntityResponse<Record<string, unknown>>(payload).data;
  if (!raw || typeof raw !== "object") return DEFAULT_FREE_SUMMARY;
  const tier =
    raw.tier === "pro" || raw.tier === "legacy" || raw.tier === "free"
      ? raw.tier
      : "free";
  const rawStatus = raw.status === "canceled" ? "cancelled" : raw.status;
  const status =
    rawStatus === "trialing" ||
    rawStatus === "active" ||
    rawStatus === "past_due" ||
    rawStatus === "cancelled" ||
    rawStatus === "paused"
      ? rawStatus
      : "active";

  return {
    tier,
    status,
    billing_interval:
      raw.billing_interval === "monthly" ||
      raw.billing_interval === "annual" ||
      raw.billing_interval === "lifetime"
        ? raw.billing_interval
        : null,
    can_manage_subscription: raw.can_manage_subscription === true,
    current_period_end:
      typeof raw.current_period_end === "string"
        ? raw.current_period_end
        : undefined,
    trial_ends_at:
      typeof raw.trial_ends_at === "string"
        ? raw.trial_ends_at
        : typeof raw.trial_end === "string"
          ? raw.trial_end
          : undefined,
    cancel_at_period_end:
      typeof raw.cancel_at_period_end === "boolean"
        ? raw.cancel_at_period_end
        : undefined,
    provider:
      raw.provider === "polar" || raw.payment_provider === "polar"
        ? "polar"
        : undefined,
    external_product_id:
      typeof raw.external_product_id === "string"
        ? raw.external_product_id
        : undefined,
    features: Array.isArray(raw.features)
      ? (raw.features as SubscriptionSummary["features"])
      : undefined,
    currency:
      raw.currency === "USD" || raw.currency === "NGN"
        ? raw.currency
        : undefined,
    country: typeof raw.country === "string" ? raw.country : undefined,
    usage: parseUsage(raw.usage),
  };
}

export function extractBillingUrl(
  payload: unknown,
  key: "checkout_url" | "portal_url",
): string | null {
  const data = normalizeEntityResponse<Record<string, unknown>>(payload).data;
  return data && typeof data[key] === "string" && data[key] ? data[key] : null;
}

export function normalizeInvoices(payload: unknown): BillingInvoice[] {
  return normalizeCollectionResponse<BillingInvoice>(payload).data;
}
