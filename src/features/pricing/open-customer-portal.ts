import endpoint from "@/api/endpoint";
import { postFetcher } from "@/api/fetcher";

export async function openCustomerPortal(returnUrl: string): Promise<string> {
  const res = await postFetcher(endpoint.billingPortal, { arg: { return_url: returnUrl } });
  if (!res?.success) {
    throw new Error(typeof res?.message === "string" ? res.message : "Could not open billing portal");
  }
  const payload = res.data as { portal_url?: string } | undefined;
  if (!payload?.portal_url) {
    throw new Error("No portal URL returned");
  }
  return payload.portal_url;
}
