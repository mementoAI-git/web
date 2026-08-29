import endpoint from "@/api/endpoint";
import { postFetcher } from "@/api/fetcher";

export function cancelSubscription() {
  return postFetcher(endpoint.billingCancel, { arg: {} });
}

export function resumeSubscription() {
  return postFetcher(endpoint.billingResume, { arg: {} });
}
