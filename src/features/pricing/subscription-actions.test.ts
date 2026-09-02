import { afterEach, describe, expect, it, vi } from "vitest";
import * as fetcherModule from "@/api/fetcher";
import endpoint from "@/api/endpoint";
import { cancelSubscription, resumeSubscription } from "./subscription-actions";

afterEach(() => vi.restoreAllMocks());

describe("subscription actions", () => {
  it.each([
    [cancelSubscription, endpoint.billingCancel, "Subscription cancellation scheduled"],
    [resumeSubscription, endpoint.billingResume, "Subscription resumed"],
  ])("preserves the response for %s", async (action, path, message) => {
    const response = { success: true, message, data: null, meta: { request_id: "req-1" } };
    vi.spyOn(fetcherModule, "postFetcher").mockResolvedValue(response);

    await expect(action()).resolves.toEqual(response);
    expect(fetcherModule.postFetcher).toHaveBeenCalledWith(path, { arg: {} });
  });

  it("does not swallow structured subscription errors", async () => {
    const error = Object.assign(new Error("Upgrade required"), {
      code: "SUBSCRIPTION_REQUIRED",
      details: { required_tier: "pro" },
      request_id: "req-2",
    });
    vi.spyOn(fetcherModule, "postFetcher").mockRejectedValue(error);

    await expect(cancelSubscription()).rejects.toBe(error);
  });
});
