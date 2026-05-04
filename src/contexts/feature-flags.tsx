"use client";

import endpoint from "@/api/endpoint";
import { fetcher } from "@/api/fetcher";
import { useStore } from "@/hooks/use-store";
import { createContext, useCallback, useContext, useMemo } from "react";
import type { PropsWithChildren } from "react";
import useSWR from "swr";

type FeatureState = {
  enabled: boolean;
  source?: string;
};

interface FeatureFlagsContextValue {
  isReady: boolean;
  evaluateFlag: (key: string) => Promise<FeatureState>;
  canUse: (key: string, fallback?: boolean) => boolean;
}

const featureFlagsContext = createContext<FeatureFlagsContextValue>({
  isReady: false,
  evaluateFlag: async () => ({ enabled: true }),
  canUse: (_key: string, fallback = true) => fallback,
});

const parseAdminEmails = () =>
  (import.meta.env.VITE_FEATURE_FLAGS_ADMIN_EMAILS as string | undefined)
    ?.split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean) || [];

// eslint-disable-next-line react-refresh/only-export-components
export const isFeatureFlagAdminUser = (email?: string | null) => {
  if (!email) return false;
  return parseAdminEmails().includes(email.toLowerCase());
};

export function FeatureFlagsProvider({ children }: PropsWithChildren) {
  const { auth } = useStore();
  const enabled = Boolean(auth?.access_token);
  const { data, isLoading } = useSWR(
    enabled ? `${endpoint.featureFlags}?page=1&limit=200` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const map = useMemo(() => {
    const source = new Map<string, boolean>();
    const docs = Array.isArray(data?.data?.docs) ? data.data.docs : [];
    docs.forEach((item: { key: string; effectiveValue?: boolean; defaultValue?: boolean }) => {
      source.set(item.key, item.effectiveValue ?? item.defaultValue ?? true);
    });
    return source;
  }, [data]);

  const evaluateFlag = useCallback(async (key: string) => {
    try {
      const url = endpoint.featureFlagEvaluate.replace(":key", key);
      const result = await fetcher(url);
      return {
        enabled: Boolean(result?.data?.enabled ?? true),
        source: result?.data?.source,
      };
    } catch {
      return { enabled: true, source: "fallback" };
    }
  }, []);

  const canUse = useCallback(
    (key: string, fallback = true) => {
      if (!enabled) return fallback;
      if (!map.has(key)) return fallback;
      return Boolean(map.get(key));
    },
    [enabled, map],
  );

  const value = useMemo(
    () => ({ isReady: !isLoading, evaluateFlag, canUse }),
    [evaluateFlag, isLoading, canUse],
  );

  return (
    <featureFlagsContext.Provider value={value}>
      {children}
    </featureFlagsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useFeatureFlags = () => useContext(featureFlagsContext);
