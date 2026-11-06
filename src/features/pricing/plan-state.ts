import dayjs from "dayjs";
import type { BillingInterval } from "./plan-catalog";
import type { SubscriptionSummary } from "./types";

export type ProAction = "checkout" | "portal" | null;
/** "hidden" is for accounts with no billing period, where a selection would misstate it. */
export type IntervalControl = "enabled" | "disabled" | "hidden";

export interface PlanState {
  interval: BillingInterval;
  intervalControl: IntervalControl;
  pro: { label: string; action: ProAction };
  free: { label: string; canDowngrade: boolean };
  /** Only recurring web subscriptions can be cancelled or resumed from here. */
  cancelRow: { title: string; body: string; action: "cancel" | "resume" } | null;
  note: string | null;
}

interface PlanStateInput {
  summary: SubscriptionSummary | null;
  loading: boolean;
  error: unknown;
  selectedInterval: BillingInterval | null;
  canCheckout: boolean;
  canPortal: boolean;
  upgradeLabel: string;
}

const NO_BILLING_PERIOD = "No monthly or annual billing period is attached to this account.";

/**
 * The summary keeps `tier: "pro"` after a cancelled subscription's period ends,
 * while the API has already returned the account to free. These members must be
 * able to subscribe again.
 */
function hasEndedSubscription(summary: SubscriptionSummary) {
  if (summary.status !== "cancelled") return false;
  return (
    !summary.current_period_end ||
    dayjs(summary.current_period_end).isBefore(dayjs())
  );
}

/**
 * Trials are for first-time subscribers only, which the API reports directly.
 * The fallback covers an API that doesn't send the flag yet, using fields only a
 * subscription or store purchase writes.
 */
function hasHadSubscription(summary: SubscriptionSummary | null) {
  if (typeof summary?.has_used_trial === "boolean")
    return summary.has_used_trial;
  return Boolean(
    summary &&
      (summary.status === "cancelled" ||
        summary.cancel_at_period_end ||
        summary.current_period_end ||
        summary.trial_ends_at ||
        summary.billing_interval),
  );
}

function subscribedInterval(summary: SubscriptionSummary | null) {
  const interval = summary?.billing_interval;
  return interval === "monthly" || interval === "annual" ? interval : null;
}

function withRequestState(state: PlanState, loading: boolean, error: unknown) {
  if (!loading && !error) return state;
  const label = loading ? "Loading your plan…" : "Plan unavailable";
  return {
    ...state,
    pro: { label, action: null },
    free: { label, canDowngrade: false },
  };
}

function resolvePlanState({
  summary,
  selectedInterval,
  canCheckout,
  canPortal,
  upgradeLabel,
}: PlanStateInput): PlanState {
  const subscribed = subscribedInterval(summary);
  const downgrade = (canDowngrade: boolean) => ({
    label: "Downgrade to free",
    canDowngrade,
  });

  if (
    !summary ||
    summary.tier === "free" ||
    (summary.tier === "pro" && hasEndedSubscription(summary))
  )
    return {
      interval: selectedInterval ?? "monthly",
      intervalControl: "enabled",
      pro: canCheckout
        ? {
            label: hasHadSubscription(summary)
              ? "Subscribe to Pro"
              : upgradeLabel,
            action: "checkout",
          }
        : { label: "Checkout unavailable", action: null },
      free: { label: "Current plan", canDowngrade: false },
      cancelRow: null,
      note: null,
    };

  if (summary.tier === "legacy")
    return {
      interval: subscribed ?? "monthly",
      intervalControl: "hidden",
      pro: { label: "Included in Legacy", action: null },
      free: downgrade(false),
      cancelRow: null,
      note: `Current plan: Legacy. ${NO_BILLING_PERIOD}`,
    };

  // Pro with nothing to manage on the web: promos, lifetime, store billing, or a
  // paused or cancelled subscription. A checkout here could charge them twice.
  if (!summary.can_manage_subscription) {
    const until = summary.current_period_end
      ? dayjs(summary.current_period_end).format("MMM D, YYYY")
      : null;
    return {
      interval: subscribed ?? "monthly",
      intervalControl: subscribed ? "disabled" : "hidden",
      pro: { label: "Current plan", action: null },
      free: downgrade(false),
      cancelRow: null,
      note:
        summary.status === "cancelled"
          ? `Your subscription is cancelled. You’ll keep Pro features until ${until}.`
          : summary.status === "paused"
            ? "Your subscription is paused."
            : subscribed
              ? "Your Pro access has no recurring web subscription to manage."
              : `Current plan: Pro access. ${NO_BILLING_PERIOD}`,
    };
  }

  const scheduled = summary.cancel_at_period_end === true;
  const trialing = summary.status === "trialing";
  const pastDue = summary.status === "past_due";
  const cancelRow: PlanState["cancelRow"] = scheduled
    ? {
        title: "Cancellation scheduled",
        body: "You’ll keep Pro features until the end of your billing period.",
        action: "resume",
      }
    : {
        title: "Cancel plan",
        body: trialing
          ? "You’ll keep Pro features until your trial ends."
          : "You’ll keep Pro features until the end of your billing period.",
        action: "cancel",
      };
  const portal = (label: string) =>
    canPortal
      ? { label, action: "portal" as const }
      : { label: "Plan changes unavailable", action: null };

  if (scheduled)
    return {
      interval: subscribed ?? "monthly",
      intervalControl: subscribed ? "disabled" : "hidden",
      pro: { label: "Current plan", action: null },
      free: downgrade(false),
      cancelRow,
      note: null,
    };

  if (pastDue)
    return {
      interval: subscribed ?? "monthly",
      intervalControl: subscribed ? "disabled" : "hidden",
      pro: portal("Update payment"),
      free: downgrade(true),
      cancelRow,
      note: "Your last payment didn’t go through. Update your payment method to keep Pro.",
    };

  if (!subscribed)
    return {
      interval: "monthly",
      intervalControl: "hidden",
      pro: portal("Manage plan"),
      free: downgrade(true),
      cancelRow,
      note: null,
    };

  const interval = selectedInterval ?? subscribed;
  return {
    interval,
    intervalControl: "enabled",
    pro:
      interval === subscribed
        ? { label: "Current plan", action: null }
        : portal(interval === "annual" ? "Upgrade" : "Switch to monthly"),
    free: downgrade(true),
    cancelRow,
    note: null,
  };
}

/** Every button, label, and message on the plans page, for each subscription state. */
export function getPlanState(input: PlanStateInput): PlanState {
  return withRequestState(resolvePlanState(input), input.loading, input.error);
}
