import { useCallback } from "react";
import { useSWRConfig } from "swr";
import endpoint from "@/api/endpoint";
import type { IResponse } from "@/api/interface";
import { useStore } from "@/hooks/use-store";
import type { IUser } from "@/utility/interface";

type FinishedStatus = "completed" | "skipped";

/**
 * Record a finished onboarding in both the store and the cached profile.
 *
 * The dashboard's AuthCheck remounts on navigation and hydrates the store from
 * the SWR profile cache. If only the store is updated, that cached profile
 * (still "never") overwrites it and the onboarding guard sends the user back
 * to the start of onboarding.
 */
export function useFinishOnboarding() {
  const { user, setUser } = useStore();
  const { mutate } = useSWRConfig();
  return useCallback(
    (status: FinishedStatus) => {
      const patch: Partial<IUser> = { onboarding_status: status };
      if (status === "completed") patch.onboarded = true;
      if (user) setUser?.({ ...user, ...patch });
      void mutate(
        endpoint.profile,
        (cached?: IResponse<IUser>) =>
          cached?.data ? { ...cached, data: { ...cached.data, ...patch } } : cached,
        { revalidate: true },
      ).catch(() => undefined);
    },
    [user, setUser, mutate],
  );
}
