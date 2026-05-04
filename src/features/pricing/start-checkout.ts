import endpoint from "@/api/endpoint";
import { postFetcher } from "@/api/fetcher";

import type { CheckoutRequestBody } from "./types";

export async function startCheckout(body: CheckoutRequestBody): Promise<string> {
  const res = await postFetcher(endpoint.billingCheckout, { arg: body });
  if (!res?.success) {
    throw new Error(typeof res?.message === "string" ? res.message : "Checkout failed");
  }
  const payload = res.data as { checkout_url?: string } | undefined;
  if (!payload?.checkout_url) {
    throw new Error("No checkout URL returned");
  }
  return payload.checkout_url;
}
