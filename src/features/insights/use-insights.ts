import useSWR from "swr";
import endpoint from "@/api/endpoint";
import type { InsightList } from "./insights-api.types";

const GENERATING_POLL_MS = 5000;

/** The current batch, polling only while the next one is being prepared. */
export function useInsights() {
  const { data, error, isLoading, mutate } = useSWR<{ data: InsightList }>(
    endpoint.insights,
    {
      refreshInterval: (latest) =>
        latest?.data?.generating ? GENERATING_POLL_MS : 0,
    },
  );
  return { list: data?.data ?? null, error, isLoading, mutate };
}
