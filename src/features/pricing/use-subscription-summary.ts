import useSWR from "swr";

import endpoint from "@/api/endpoint";
import { fetcher } from "@/api/fetcher";
import { useStore } from "@/hooks/use-store";

import { DEFAULT_FREE_SUMMARY } from "./default-free";
import { normalizeSubscriptionSummary } from "./billing-adapters";

function isNotFoundError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const o = err as { httpStatus?: number; status?: number };
  return o.httpStatus === 404 || o.status === 404;
}

export function useSubscriptionSummary() {
  const { auth, hydrated } = useStore();
  const loggedIn = Boolean(hydrated && auth?.access_token);
  const key = loggedIn ? endpoint.billingSubscription : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    async (url: string) => {
      try {
        const res = await fetcher(url);
        return normalizeSubscriptionSummary(res);
      } catch (e) {
        if (isNotFoundError(e)) return DEFAULT_FREE_SUMMARY;
        throw e;
      }
    },
    {
      revalidateOnFocus: true,
      shouldRetryOnError: (err) => !isNotFoundError(err),
    },
  );

  return {
    summary: data ?? null,
    error: isNotFoundError(error) ? null : error,
    isLoading: loggedIn && isLoading && data == null && !isNotFoundError(error),
    mutate,
  };
}
