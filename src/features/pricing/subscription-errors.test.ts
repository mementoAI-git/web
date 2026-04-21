import { describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import {
  handleSubscriptionGateError,
  normalizeGateFeature,
  parseSubscriptionGateError,
  parseSubscriptionGateFromBody,
} from "./subscription-errors";

vi.mock("sonner", () => ({
  toast: {
    message: vi.fn(),
  },
}));

describe("subscription-errors", () => {
  it("parses 402 body with feature", () => {
    const gate = parseSubscriptionGateFromBody({
      error: "subscription_required",
      feature: "beneficiaries",
      message: "Limit reached",
    });
    expect(gate?.feature).toBe("beneficiaries");
    expect(gate?.message).toBe("Limit reached");
  });

  it("normalizes unknown feature to storage bucket copy", () => {
    expect(normalizeGateFeature("unknown_feature")).toBe("storage");
  });

  it("parses fetcher throw shape", () => {
    const gate = parseSubscriptionGateError({
      httpStatus: 402,
      feature: "timed_messages",
      message: "Too many",
    });
    expect(gate?.feature).toBe("timed_messages");
  });

  it("handleSubscriptionGateError returns false for non-402", () => {
    expect(handleSubscriptionGateError({ httpStatus: 500 })).toBe(false);
  });

  it("handleSubscriptionGateError notifies for 402", () => {
    expect(
      handleSubscriptionGateError({
        httpStatus: 402,
        feature: "storage",
        message: "Full",
      }),
    ).toBe(true);
    expect(toast.message).toHaveBeenCalled();
  });
});
