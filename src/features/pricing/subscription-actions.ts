import endpoint from "@/api/endpoint";
import { postFetcher } from "@/api/fetcher";

export function cancelSubscription(
  feedback: { reason?: string; comment?: string } = {},
) {
  return postFetcher(endpoint.billingCancel, { arg: feedback });
}

export function resumeSubscription() {
  return postFetcher(endpoint.billingResume, { arg: {} });
}
