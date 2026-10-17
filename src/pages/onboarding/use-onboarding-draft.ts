import { useCallback, useEffect, useState, type SetStateAction } from "react";
import type { EnrichmentCategory } from "@/features/enrichment/enrichment-categories";
import { lifeAreaOptions, reasonOptions } from "./flow-options";

export interface OnboardingDraft {
  step: 1 | 2 | 3;
  reasons: string[];
  about: string;
  areas: EnrichmentCategory[];
}

export function onboardingDraftKey(userId: string) {
  return `memento:onboarding-flow:${userId}`;
}

export function readOnboardingDraft(userId: string): OnboardingDraft {
  const empty: OnboardingDraft = { step: 1, reasons: [], about: "", areas: [] };
  try {
    const saved: unknown = JSON.parse(
      sessionStorage.getItem(onboardingDraftKey(userId)) ?? "null",
    );
    if (!saved || typeof saved !== "object") return empty;
    const value = saved as Record<string, unknown>;
    return {
      step: value.step === 2 || value.step === 3 ? value.step : 1,
      reasons: Array.isArray(value.reasons)
        ? [
            ...new Set(
              value.reasons.filter(
                (reason): reason is string =>
                  typeof reason === "string" &&
                  reasonOptions.some((option) => option.value === reason),
              ),
            ),
          ]
        : [],
      about: typeof value.about === "string" ? value.about : "",
      areas: Array.isArray(value.areas)
        ? [
            ...new Set(
              value.areas.filter((area): area is EnrichmentCategory =>
                lifeAreaOptions.some((option) => option.value === area),
              ),
            ),
          ].slice(0, 3)
        : [],
    };
  } catch {
    return empty;
  }
}

export function clearOnboardingDraft(userId: string) {
  try {
    sessionStorage.removeItem(onboardingDraftKey(userId));
  } catch {
    /* Storage may be unavailable. */
  }
}

export function useOnboardingDraft(userId: string) {
  const [entry, setEntry] = useState(() => ({
    userId,
    draft: readOnboardingDraft(userId),
  }));
  if (entry.userId !== userId) {
    setEntry({ userId, draft: readOnboardingDraft(userId) });
  }
  useEffect(() => {
    if (entry.userId === "anonymous") return;
    try {
      sessionStorage.setItem(
        onboardingDraftKey(entry.userId),
        JSON.stringify(entry.draft),
      );
    } catch {
      /* Keep the in-memory flow usable. */
    }
  }, [entry]);
  const setDraft = useCallback((update: SetStateAction<OnboardingDraft>) => {
    setEntry((value) => ({
      ...value,
      draft: typeof update === "function" ? update(value.draft) : update,
    }));
  }, []);
  return [entry.draft, setDraft] as const;
}
