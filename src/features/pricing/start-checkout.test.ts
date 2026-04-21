import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { startCheckout } from "./start-checkout";
import * as fetcherModule from "@/api/fetcher";

describe("startCheckout", () => {
  beforeEach(() => {
    vi.spyOn(fetcherModule, "postFetcher").mockResolvedValue({
      success: true,
      data: { checkout_url: "https://checkout.test/session-abc" },
      message: "ok",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns checkout URL from successful POST /billing/checkout", async () => {
    const url = await startCheckout({
      success_url: "https://app.test/success",
      cancel_url: "https://app.test/cancel",
      tier: "pro",
      interval: "monthly",
    });
    expect(url).toBe("https://checkout.test/session-abc");
    expect(fetcherModule.postFetcher).toHaveBeenCalled();
  });

  it("throws when checkout URL is missing", async () => {
    vi.spyOn(fetcherModule, "postFetcher").mockResolvedValue({
      success: true,
      data: {},
      message: "ok",
    });
    await expect(
      startCheckout({
        success_url: "https://app.test/success",
        cancel_url: "https://app.test/cancel",
      }),
    ).rejects.toThrow(/checkout url/i);
  });
});
