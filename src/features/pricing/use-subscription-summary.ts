import useSWR from "swr";

import endpoint from "@/api/endpoint";
import { fetcher } from "@/api/fetcher";
import type { IResponse } from "@/api/interface";
import { useStore } from "@/hooks/use-store";

import { DEFAULT_FREE_SUMMARY } from "./default-free";
import type { SubscriptionSummary, SubscriptionUsage } from "./types";

function isNotFoundError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const o = err as { httpStatus?: number; status?: number };
  return o.httpStatus === 404 || o.status === 404;
}

function parseUsage(raw: unknown): SubscriptionUsage | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const u = raw as Record<string, unknown>;
  const out: SubscriptionUsage = {};
  if (typeof u.storage_used_bytes === "number") out.storage_used_bytes = u.storage_used_bytes;
  if (typeof u.storage_limit_bytes === "number") out.storage_limit_bytes = u.storage_limit_bytes;
  if (typeof u.beneficiary_count === "number") out.beneficiary_count = u.beneficiary_count;
  if (typeof u.timed_message_count === "number") out.timed_message_count = u.timed_message_count;
  return Object.keys(out).length > 0 ? out : undefined;
}

function parseSummary(res: unknown): SubscriptionSummary {
  if (!res || typeof res !== "object") return DEFAULT_FREE_SUMMARY;
  const envelope = res as IResponse & { data?: SubscriptionSummary };
  const raw = envelope.data;
  if (!raw || typeof raw !== "object") return DEFAULT_FREE_SUMMARY;
  const r = raw as Record<string, unknown>;
  const tier = r.tier === "pro" || r.tier === "legacy" || r.tier === "free" ? r.tier : "free";
  const status =
    r.status === "trialing" ||
    r.status === "active" ||
    r.status === "past_due" ||
    r.status === "cancelled" ||
    r.status === "paused" ||
    r.status === "canceled"
      ? r.status === "canceled"
        ? "cancelled"
        : r.status
      : "active";
  return {
    tier,
    status,
    current_period_end: typeof r.current_period_end === "string" ? r.current_period_end : undefined,
    trial_ends_at:
      typeof r.trial_ends_at === "string"
        ? r.trial_ends_at
        : typeof r.trial_end === "string"
          ? r.trial_end
          : undefined,
    cancel_at_period_end: typeof r.cancel_at_period_end === "boolean" ? r.cancel_at_period_end : undefined,
    provider: r.provider === "polar" || r.provider === "paystack" ? r.provider : undefined,
    external_product_id: typeof r.external_product_id === "string" ? r.external_product_id : undefined,
    features: Array.isArray(r.features) ? (r.features as SubscriptionSummary["features"]) : undefined,
    currency: r.currency === "USD" || r.currency === "NGN" ? r.currency : undefined,
    country: typeof r.country === "string" ? r.country : undefined,
    usage: parseUsage(r.usage),
  };
}

export function useSubscriptionSummary() {
  const { auth, hydrated } = useStore();
  const loggedIn = Boolean(hydrated && auth?.access_token);
  const key = loggedIn ? endpoint.billingSubscription : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    async (url: string) => {
      try {
        const res = await fetcher(url);
        return parseSummary(res);
      } catch (e) {
        if (isNotFoundError(e)) return DEFAULT_FREE_SUMMARY;
        throw e;
      }
    },
    {
      revalidateOnFocus: true,
      shouldRetryOnError: (err) => !isNotFoundError(err),
    },
  );

  return {
    summary: data ?? null,
    error: isNotFoundError(error) ? null : error,
    isLoading: loggedIn && isLoading && data == null && !isNotFoundError(error),
    mutate,
  };
}
