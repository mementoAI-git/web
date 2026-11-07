import useSWR from "swr";
import endpoint from "@/api/endpoint";
import type { InsightList } from "./insights-api.types";

const GENERATING_POLL_MS = 5000;
/** Batches change far less often than the cards. SWR pauses this in a hidden tab. */
const BACKGROUND_POLL_MS = 30000;

/** The current batch, kept current while it is on screen. */
export function useInsights() {
  const { data, error, isLoading, mutate } = useSWR<{ data: InsightList }>(
    endpoint.insights,
    {
      refreshInterval: (latest) =>
        latest?.data?.generating ? GENERATING_POLL_MS : BACKGROUND_POLL_MS,
    },
  );
  return { list: data?.data ?? null, error, isLoading, mutate };
}
