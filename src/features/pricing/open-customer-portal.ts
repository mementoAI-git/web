import endpoint from "@/api/endpoint";
import { postFetcher } from "@/api/fetcher";
import { extractBillingUrl } from "./billing-adapters";

export async function openCustomerPortal(returnUrl: string): Promise<string> {
  const res = await postFetcher(endpoint.billingPortal, { arg: { return_url: returnUrl } });
  if (!res?.success) {
    throw new Error(typeof res?.message === "string" ? res.message : "Could not open billing portal");
  }
  const url = extractBillingUrl(res, "portal_url");
  if (!url) {
    throw new Error("No portal URL returned");
  }
  return url;
}
