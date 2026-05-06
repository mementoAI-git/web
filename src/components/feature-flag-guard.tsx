import type { PropsWithChildren, ReactNode } from "react";
import { useFeatureFlags } from "@/contexts/feature-flags";

interface FeatureFlagGuardProps extends PropsWithChildren {
  feature: string;
  fallback?: ReactNode;
}

export function FeatureFlagGuard({ feature, fallback = null, children }: FeatureFlagGuardProps) {
  const { canUse } = useFeatureFlags();
  if (!canUse(feature)) return <>{fallback}</>;
  return <>{children}</>;
}
