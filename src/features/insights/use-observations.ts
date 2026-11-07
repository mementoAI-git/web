import useSWR from "swr";
import endpoint from "@/api/endpoint";
import type { PersonaObservationsResponse } from "./observations-api.types";

const GENERATING_POLL_MS = 5000;
/** Picks up what changes elsewhere, like a chat or another device. SWR pauses it in a hidden tab. */
const BACKGROUND_POLL_MS = 10000;

type ObservationsResponse = { data: PersonaObservationsResponse };

/** The curated cards, kept current while they are on screen. */
export function useObservations() {
  const { data, error, isLoading, mutate } = useSWR<ObservationsResponse>(
    endpoint.personaObservations,
    {
      refreshInterval: (latest) =>
        latest?.data?.generating ? GENERATING_POLL_MS : BACKGROUND_POLL_MS,
    },
  );
  /** Takes the card off the list straight away, and puts it back if `request` fails. */
  const remove = (id: string, request: () => Promise<unknown>) =>
    mutate(
      async (current) => {
        await request();
        return current;
      },
      {
        optimisticData: (current) =>
          current && {
            ...current,
            data: {
              ...current.data,
              observations: current.data.observations.filter(
                (item) => item.id !== id,
              ),
            },
          },
        rollbackOnError: true,
        populateCache: false,
        revalidate: true,
      },
    );
  return {
    observations: data?.data?.observations ?? [],
    loaded: Boolean(data),
    generating: Boolean(data?.data?.generating),
    // A failed background refresh shouldn't replace cards that are already showing.
    error: data ? undefined : error,
    isLoading,
    mutate,
    remove,
  };
}
