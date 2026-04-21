import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import { canAccessFeature } from "@/features/pricing/can-access";
import { useSubscriptionSummary } from "@/features/pricing/use-subscription-summary";
import type {
  FeatureKey,
  PlanTier,
  SubscriptionSummary,
  SubscriptionUsage,
} from "@/features/pricing/types";

export interface SubscriptionContextValue {
  summary: SubscriptionSummary | null;
  usage: SubscriptionUsage | undefined;
  tier: PlanTier | null;
  status: SubscriptionSummary["status"] | null;
  trialEndsAt: string | null;
  isLoading: boolean;
  error: unknown;
  isPro: boolean;
  isLegacy: boolean;
  isProOrAbove: boolean;
  canAccess: (feature: FeatureKey) => boolean;
  refresh: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(
  null,
);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { summary, error, isLoading, mutate } = useSubscriptionSummary();

  const canAccess = useCallback(
    (feature: FeatureKey) => canAccessFeature(summary, feature),
    [summary],
  );

  const usage = summary?.usage;
  const tier = summary?.tier ?? null;
  const status = summary?.status ?? null;
  const trialEndsAt = summary?.trial_ends_at ?? null;
  const isPro = tier === "pro";
  const isLegacy = tier === "legacy";
  const isProOrAbove = isPro || isLegacy;

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      summary,
      usage,
      tier,
      status,
      trialEndsAt,
      isLoading,
      error,
      isPro,
      isLegacy,
      isProOrAbove,
      canAccess,
      refresh: () => void mutate(),
    }),
    [
      summary,
      usage,
      tier,
      status,
      trialEndsAt,
      isLoading,
      error,
      isPro,
      isLegacy,
      isProOrAbove,
      canAccess,
      mutate,
    ],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return ctx;
}
