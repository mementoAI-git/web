import endpoint from "@/api/endpoint";
import { postFetcher } from "@/api/fetcher";

import type { CheckoutRequestBody } from "./types";
import { extractBillingUrl } from "./billing-adapters";

export async function startCheckout(body: CheckoutRequestBody): Promise<string> {
  const res = await postFetcher(endpoint.billingCheckout, { arg: body });
  if (!res?.success) {
    throw new Error(typeof res?.message === "string" ? res.message : "Checkout failed");
  }
  const url = extractBillingUrl(res, "checkout_url");
  if (!url) {
    throw new Error("No checkout URL returned");
  }
  return url;
}
