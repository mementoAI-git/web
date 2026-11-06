import { describe, expect, it } from "vitest";
import { getPlanState } from "./plan-state";
import type { SubscriptionSummary } from "./types";

const FUTURE = "2099-01-15T12:00:00.000Z";
const PAST = "2020-01-15T12:00:00.000Z";

function state(
  summary: Partial<SubscriptionSummary> | null,
  overrides: Partial<Parameters<typeof getPlanState>[0]> = {},
) {
  return getPlanState({
    summary: summary && ({ tier: "pro", status: "active", ...summary } as SubscriptionSummary),
    loading: false,
    error: null,
    selectedInterval: null,
    canCheckout: true,
    canPortal: true,
    upgradeLabel: "Start 14-day trial",
    ...overrides,
  });
}
const recurring = { can_manage_subscription: true, billing_interval: "monthly" } as const;

describe("members without a subscription", () => {
  it.each([
    ["no summary", null, "Start 14-day trial"],
    ["the free tier", { tier: "free" }, "Start 14-day trial"],
    ["an abandoned checkout", { tier: "free", provider: "polar" }, "Start 14-day trial"],
    ["an API that reports the trial as unused", { tier: "free", has_used_trial: false }, "Start 14-day trial"],
    ["an API that reports the trial as used", { tier: "free", has_used_trial: true }, "Subscribe to Pro"],
    ["a cancelled subscription past its period", { status: "cancelled", current_period_end: PAST }, "Subscribe to Pro"],
    ["a cancelled subscription with no end date", { status: "cancelled" }, "Subscribe to Pro"],
    ["a free account with cancelled status", { tier: "free", status: "cancelled" }, "Subscribe to Pro"],
    ["a scheduled cancellation that has ended", { tier: "free", cancel_at_period_end: true, current_period_end: PAST }, "Subscribe to Pro"],
    ["a finished trial", { tier: "free", trial_ends_at: PAST }, "Subscribe to Pro"],
    ["a past billing interval", { tier: "free", billing_interval: "monthly" }, "Subscribe to Pro"],
  ] as const)("can start checkout from %s", (_, summary, label) => {
    const plan = state(summary);
    expect(plan.pro).toEqual({ label, action: "checkout" });
    expect(plan.free).toEqual({ label: "Current plan", canDowngrade: false });
    expect(plan.intervalControl).toBe("enabled");
    expect(plan.cancelRow).toBeNull();
    expect(plan.note).toBeNull();
  });

  it("explains when checkout is turned off", () => {
    expect(state({ tier: "free" }, { canCheckout: false }).pro).toEqual({
      label: "Checkout unavailable",
      action: null,
    });
  });
});

describe("recurring subscriptions", () => {
  it("marks the subscribed interval as current", () => {
    const plan = state(recurring);
    expect(plan.interval).toBe("monthly");
    expect(plan.pro).toEqual({ label: "Current plan", action: null });
    expect(plan.free.canDowngrade).toBe(true);
    expect(plan.cancelRow?.action).toBe("cancel");
  });

  it("opens an annual subscription on annual", () => {
    expect(state({ ...recurring, billing_interval: "annual" }).interval).toBe("annual");
  });

  it.each([
    ["monthly", "annual", "Upgrade"],
    ["annual", "monthly", "Switch to monthly"],
  ] as const)("sends a %s subscriber choosing %s to the portal", (billing_interval, selectedInterval, label) => {
    expect(state({ ...recurring, billing_interval }, { selectedInterval }).pro).toEqual({ label, action: "portal" });
  });

  it("blocks interval changes when the portal is turned off", () => {
    expect(state(recurring, { selectedInterval: "annual", canPortal: false }).pro).toEqual({
      label: "Plan changes unavailable",
      action: null,
    });
  });

  it("uses trial wording while trialing", () => {
    const plan = state({ ...recurring, status: "trialing" });
    expect(plan.pro.action).toBeNull();
    expect(plan.cancelRow?.body).toMatch(/until your trial ends/);
  });

  it("asks a past due member to update payment on either interval", () => {
    const plan = state({ ...recurring, status: "past_due" }, { selectedInterval: "annual" });
    expect(plan.pro).toEqual({ label: "Update payment", action: "portal" });
    expect(plan.interval).toBe("monthly");
    expect(plan.intervalControl).toBe("disabled");
    expect(plan.free.canDowngrade).toBe(true);
    expect(plan.note).toMatch(/payment didn’t go through/);
  });

  it("only offers to keep the plan once cancellation is scheduled", () => {
    const plan = state({ ...recurring, cancel_at_period_end: true }, { selectedInterval: "annual" });
    expect(plan.pro).toEqual({ label: "Current plan", action: null });
    expect(plan.interval).toBe("monthly");
    expect(plan.intervalControl).toBe("disabled");
    expect(plan.free.canDowngrade).toBe(false);
    expect(plan.cancelRow).toMatchObject({ title: "Cancellation scheduled", action: "resume" });
  });

  it("sends a subscription with an unknown interval to the portal", () => {
    const plan = state({ can_manage_subscription: true, billing_interval: null });
    expect(plan.pro).toEqual({ label: "Manage plan", action: "portal" });
    expect(plan.intervalControl).toBe("hidden");
    expect(plan.note).toBeNull();
  });
});

describe("paid access with nothing to manage on the web", () => {
  it.each([
    ["promo access", { billing_interval: null }],
    ["lifetime access", { billing_interval: "lifetime" }],
    ["store billing", { billing_interval: "annual" }],
    ["a paused subscription", { status: "paused", billing_interval: "monthly" }],
    ["a cancelled subscription still in its period", { status: "cancelled", current_period_end: FUTURE, billing_interval: "monthly" }],
  ] as const)("never offers checkout for %s, on any interval", (_, summary) => {
    for (const selectedInterval of [null, "monthly", "annual"] as const) {
      const plan = state({ can_manage_subscription: false, ...summary }, { selectedInterval });
      expect(plan.pro).toEqual({ label: "Current plan", action: null });
      expect(plan.free.canDowngrade).toBe(false);
      expect(plan.cancelRow).toBeNull();
      expect(plan.note).toBeTruthy();
      expect(plan.intervalControl).not.toBe("enabled");
    }
  });

  it("says when a cancelled subscription ends", () => {
    expect(
      state({ status: "cancelled", current_period_end: FUTURE, billing_interval: "monthly" }).note,
    ).toMatch(/until Jan 15, 2099/);
  });

  it("hides the interval when no billing period exists", () => {
    expect(state({ billing_interval: null }).intervalControl).toBe("hidden");
    expect(state({ billing_interval: "lifetime" }).intervalControl).toBe("hidden");
  });

  it("treats Legacy as included", () => {
    const plan = state({ tier: "legacy", billing_interval: "lifetime" });
    expect(plan.pro).toEqual({ label: "Included in Legacy", action: null });
    expect(plan.free.canDowngrade).toBe(false);
    expect(plan.intervalControl).toBe("hidden");
    expect(plan.note).toMatch(/Legacy/);
  });
});

describe("while the plan is unknown", () => {
  it.each([
    ["loading", { loading: true }, "Loading your plan…"],
    ["failed", { error: new Error("Unavailable") }, "Plan unavailable"],
  ] as const)("disables both actions when %s", (_, overrides, label) => {
    for (const summary of [{ tier: "free" }, recurring] as const) {
      const plan = state(summary, overrides);
      expect(plan.pro).toEqual({ label, action: null });
      expect(plan.free).toEqual({ label, canDowngrade: false });
    }
  });
});
