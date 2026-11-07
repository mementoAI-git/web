import useSWR from "swr";
import endpoint from "@/api/endpoint";
import type { PersonaObservationsResponse } from "./observations-api.types";

const GENERATING_POLL_MS = 5000;

/** The curated cards, polling only while new facts are being considered. */
export function useObservations() {
  const { data, error, isLoading, mutate } = useSWR<{
    data: PersonaObservationsResponse;
  }>(endpoint.personaObservations, {
    refreshInterval: (latest) =>
      latest?.data?.generating ? GENERATING_POLL_MS : 0,
  });
  return {
    observations: data?.data?.observations ?? [],
    generating: Boolean(data?.data?.generating),
    error,
    isLoading,
    mutate,
  };
}
