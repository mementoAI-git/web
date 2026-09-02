import { describe, expect, it } from "vitest";
import {
  extractBillingUrl,
  normalizeInvoices,
  normalizeSubscriptionSummary,
} from "./billing-adapters";

describe("Polar billing adapters", () => {
  it("normalizes the canonical subscription and usage response", () => {
    expect(
      normalizeSubscriptionSummary({
        data: {
          tier: "pro",
          status: "active",
          provider: "polar",
          usage: {
            storage_used_bytes: 42,
            storage_reserved_bytes: 8,
            storage_limit_bytes: 100,
            remaining_bytes: 50,
            percent_used: 50,
            over_limit: false,
          },
        },
      }),
    ).toMatchObject({
      tier: "pro",
      status: "active",
      provider: "polar",
      usage: {
        storage_used_bytes: 42,
        storage_reserved_bytes: 8,
        storage_limit_bytes: 100,
        remaining_bytes: 50,
        percent_used: 50,
        over_limit: false,
      },
    });
  });

  it("does not expose unsupported legacy payment providers", () => {
    expect(
      normalizeSubscriptionSummary({
        data: { tier: "pro", status: "active", provider: "paystack" },
      }).provider,
    ).toBeUndefined();
  });

  it("extracts checkout and portal URLs from canonical or legacy placement", () => {
    expect(
      extractBillingUrl(
        { data: { checkout_url: "https://polar.test/checkout" } },
        "checkout_url",
      ),
    ).toBe("https://polar.test/checkout");
    expect(
      extractBillingUrl(
        { portal_url: "https://polar.test/portal" },
        "portal_url",
      ),
    ).toBe("https://polar.test/portal");
  });

  it("normalizes invoice arrays and paginated invoice responses", () => {
    expect(normalizeInvoices({ data: [{ id: "one" }] })).toEqual([
      { id: "one" },
    ]);
    expect(normalizeInvoices({ data: { docs: [{ id: "two" }] } })).toEqual([
      { id: "two" },
    ]);
  });
});
