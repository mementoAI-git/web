"use client";

import endpoint from "@/api/endpoint";
import { deleteFetcher, fetcher, postFetcher, putFetcher } from "@/api/fetcher";
import { createContext, useCallback, useContext, useMemo } from "react";
import type { PropsWithChildren } from "react";
import useSWR from "swr";
import { mutate } from "swr";

type FeatureFlagListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  domain?: string;
};

const buildListKey = (query?: FeatureFlagListQuery) => {
  const params = new URLSearchParams();
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.search) params.set("search", query.search);
  if (query?.domain) params.set("domain", query.domain);
  const suffix = params.toString();
  return suffix ? `${endpoint.featureFlags}?${suffix}` : endpoint.featureFlags;
};

interface FeatureFlagsAdminContextValue {
  useFlagsList: (query?: FeatureFlagListQuery) => {
    data: {
      data?: {
        docs?: Array<{
          key: string;
          domain?: string;
          description?: string;
          defaultValue?: boolean;
          effectiveValue?: boolean;
          hasOverrides?: boolean;
          updatedAt?: string;
        }>;
      };
    } | null;
    isLoading: boolean;
    error: unknown;
    key: string;
  };
  getFlagDetail: (key: string) => Promise<Record<string, unknown> | null>;
  getFlagAudit: (key: string) => Promise<Array<Record<string, unknown>>>;
  updateDefault: (key: string, value: boolean, reason?: string) => Promise<void>;
  upsertOverride: (
    key: string,
    scopeType: "global" | "environment" | "user",
    scopeId: string,
    value: boolean,
    reason?: string,
    rolloutPercentage?: number | null,
  ) => Promise<void>;
  deleteOverride: (
    key: string,
    scopeType: "global" | "environment" | "user",
    scopeId: string,
    reason?: string,
  ) => Promise<void>;
  updateRollout: (
    key: string,
    scopeType: "global" | "environment" | "user",
    scopeId: string,
    rolloutPercentage: number | null,
    reason?: string,
  ) => Promise<void>;
  bulkByPrefix: (prefix: string, value: boolean, reason?: string) => Promise<void>;
}

const featureFlagsAdminContext = createContext<FeatureFlagsAdminContextValue>({
  useFlagsList: () => ({ data: null, isLoading: false, error: null, key: endpoint.featureFlags }),
  getFlagDetail: async () => null,
  getFlagAudit: async () => [],
  updateDefault: async () => undefined,
  upsertOverride: async () => undefined,
  deleteOverride: async () => undefined,
  updateRollout: async () => undefined,
  bulkByPrefix: async () => undefined,
});

export function FeatureFlagsAdminProvider({ children }: PropsWithChildren) {
  const useFlagsList = (query?: FeatureFlagListQuery) => {
    const key = buildListKey(query);
    const { data, isLoading, error } = useSWR(key, fetcher, {
      revalidateOnFocus: false,
    });
    return { data, isLoading, error, key };
  };

  const refreshAll = useCallback(async () => {
    await mutate((key) => typeof key === "string" && key.startsWith(endpoint.featureFlags));
  }, []);

  const getFlagDetail = useCallback(async (key: string) => {
    const url = endpoint.featureFlag.replace(":key", key);
    const result = await fetcher(url);
    return result?.data;
  }, []);

  const getFlagAudit = useCallback(async (key: string) => {
    const url = `${endpoint.featureFlag.replace(":key", key)}/audit`;
    const result = await fetcher(url);
    return result?.data || [];
  }, []);

  const updateDefault = useCallback(async (key: string, value: boolean, reason?: string) => {
    const url = `${endpoint.featureFlag.replace(":key", key)}/default`;
    await putFetcher(url, { arg: { value, reason } });
    await refreshAll();
  }, [refreshAll]);

  const upsertOverride = useCallback(
    async (
      key: string,
      scopeType: "global" | "environment" | "user",
      scopeId: string,
      value: boolean,
      reason?: string,
      rolloutPercentage?: number | null,
    ) => {
      const url = `${endpoint.featureFlag.replace(":key", key)}/overrides/${scopeType}/${scopeId}`;
      await putFetcher(url, { arg: { value, reason, rolloutPercentage } });
      await refreshAll();
    },
    [refreshAll],
  );

  const deleteOverride = useCallback(
    async (
      key: string,
      scopeType: "global" | "environment" | "user",
      scopeId: string,
      reason?: string,
    ) => {
      const url = `${endpoint.featureFlag.replace(":key", key)}/overrides/${scopeType}/${scopeId}`;
      await deleteFetcher(url, { arg: { reason } });
      await refreshAll();
    },
    [refreshAll],
  );

  const updateRollout = useCallback(
    async (
      key: string,
      scopeType: "global" | "environment" | "user",
      scopeId: string,
      rolloutPercentage: number | null,
      reason?: string,
    ) => {
      const url = `${endpoint.featureFlag.replace(":key", key)}/rollout/${scopeType}/${scopeId}`;
      await putFetcher(url, { arg: { rolloutPercentage, reason } });
      await refreshAll();
    },
    [refreshAll],
  );

  const bulkByPrefix = useCallback(async (prefix: string, value: boolean, reason?: string) => {
    await postFetcher(`${endpoint.featureFlags}/bulk`, { arg: { prefix, value, reason } });
    await refreshAll();
  }, [refreshAll]);

  const value = useMemo(
    () => ({
      useFlagsList,
      getFlagDetail,
      getFlagAudit,
      updateDefault,
      upsertOverride,
      deleteOverride,
      updateRollout,
      bulkByPrefix,
    }),
    [
      getFlagDetail,
      getFlagAudit,
      updateDefault,
      upsertOverride,
      deleteOverride,
      updateRollout,
      bulkByPrefix,
    ],
  );

  return (
    <featureFlagsAdminContext.Provider value={value}>
      {children}
    </featureFlagsAdminContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useFeatureFlagsAdmin = () => useContext(featureFlagsAdminContext);
