import { useState, useCallback, useEffect } from "react";
import type {
  AgeBand,
  PassionKey,
  MiscMotivationChip,
  LifeSituationKey,
  PersonalityTraitKey,
  MemoryTreasureKey,
  ChronotypeKey,
  SharingIntentKey,
} from "@/features/onboarding-groot/types";
import type { EnrichmentCategory } from "@/features/enrichment/enrichment-categories";

/** 1–5 hook, 6 branch, 7–11 deep (Q6–Q10), 12 closing */
export type OnboardQuestionsStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export const ONBOARD_QUESTIONS_STEP_LABELS: Record<OnboardQuestionsStep, string> = {
  1: "Why you're here",
  2: "A little about you",
  3: "Your work",
  4: "Home",
  5: "How people see you",
  6: "Your pace",
  7: "Moments you treasure",
  8: "What pulls you in",
  9: "Your rhythm",
  10: "Privacy",
  11: "Where to start",
  12: "You're all set",
};

export const MAX_PERSONALITY_TRAITS = 2;
export const MAX_MEMORY_TREASURES = 3;
export const MAX_PASSIONS_MISC = 3;
export const MAX_FOCUS_FIRST = 2;

export interface OnboardQuestionsState {
  step: OnboardQuestionsStep;
  /** Q1 — includes `something_else` + `motivationDetail` */
  motivationChip: MiscMotivationChip | null;
  motivationDetail: string;
  ageBand: AgeBand | null;
  lifeSituation: LifeSituationKey | null;
  lifeSituationDetail: string;
  homePlace: string;
  personalityTraits: PersonalityTraitKey[];
  personalityDetail: string;
  memoryTreasures: MemoryTreasureKey[];
  memoryTreasuresDetail: string;
  passions: PassionKey[];
  passionsDetail: string;
  chronotype: ChronotypeKey | null;
  sharingIntent: SharingIntentKey | null;
  priorityDimensions: EnrichmentCategory[];
  dimensionsDetail: string;
  /** True after “Continue later” on step 6 — closing copy uses partial mode */
  skippedDeepPersonalization: boolean;
}

const INITIAL: OnboardQuestionsState = {
  step: 1,
  motivationChip: null,
  motivationDetail: "",
  ageBand: null,
  lifeSituation: null,
  lifeSituationDetail: "",
  homePlace: "",
  personalityTraits: [],
  personalityDetail: "",
  memoryTreasures: [],
  memoryTreasuresDetail: "",
  passions: [],
  passionsDetail: "",
  chronotype: null,
  sharingIntent: null,
  priorityDimensions: [],
  dimensionsDetail: "",
  skippedDeepPersonalization: false,
};

export function useOnboardQuestionsState(
  initialState?: Partial<OnboardQuestionsState>,
) {
  const [state, setState] = useState<OnboardQuestionsState>(() => ({
    ...INITIAL,
    ...initialState,
  }));

  useEffect(() => {
    if (!initialState) return;
    setState((prev) => {
      const next = { ...prev, ...initialState };
      const changed = (Object.keys(initialState) as Array<keyof OnboardQuestionsState>).some(
        (key) => prev[key] !== next[key],
      );
      return changed ? next : prev;
    });
  }, [initialState]);

  const update = useCallback(<K extends keyof OnboardQuestionsState>(
    key: K,
    value: OnboardQuestionsState[K],
  ) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => {
      if (prev.step >= 12) return prev;
      return { ...prev, step: (prev.step + 1) as OnboardQuestionsStep };
    });
  }, []);

  const goToDeepPhase = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: 7,
      skippedDeepPersonalization: false,
    }));
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => {
      if (prev.step <= 1) return prev;
      if (prev.step === 7) return { ...prev, step: 6 };
      return { ...prev, step: (prev.step - 1) as OnboardQuestionsStep };
    });
  }, []);

  const canAdvance = useCallback((step: OnboardQuestionsStep): boolean => {
    switch (step) {
      case 1: {
        if (!state.motivationChip) return false;
        if (state.motivationChip === "something_else") {
          return state.motivationDetail.trim().length > 0;
        }
        return true;
      }
      case 2:
        return state.ageBand !== null;
      case 3: {
        if (!state.lifeSituation) return false;
        if (state.lifeSituation === "something_else") {
          return state.lifeSituationDetail.trim().length > 0;
        }
        return true;
      }
      case 4:
        return state.homePlace.trim().length > 0;
      case 5: {
        if (state.personalityTraits.length < 1) return false;
        if (
          state.personalityTraits.includes("something_else") &&
          state.personalityTraits.length === 1
        ) {
          return state.personalityDetail.trim().length > 0;
        }
        return true;
      }
      case 6:
        return true;
      case 7:
        return state.memoryTreasures.length >= 1;
      case 8:
        return state.passions.length >= 1;
      case 9:
        return state.chronotype !== null;
      case 10:
        return state.sharingIntent !== null;
      case 11:
        return state.priorityDimensions.length >= 1;
      case 12:
        return true;
      default:
        return false;
    }
  }, [state]);

  const setMotivationChip = (v: MiscMotivationChip | null) => update("motivationChip", v);
  const setMotivationDetail = (v: string) => update("motivationDetail", v);
  const setAgeBand = (v: AgeBand | null) => update("ageBand", v);
  const setLifeSituation = (v: LifeSituationKey | null) => update("lifeSituation", v);
  const setLifeSituationDetail = (v: string) => update("lifeSituationDetail", v);
  const setHomePlace = (v: string) => update("homePlace", v);
  const setPersonalityTraits = (v: PersonalityTraitKey[]) => update("personalityTraits", v);
  const setPersonalityDetail = (v: string) => update("personalityDetail", v);
  const setMemoryTreasures = (v: MemoryTreasureKey[]) => update("memoryTreasures", v);
  const setMemoryTreasuresDetail = (v: string) => update("memoryTreasuresDetail", v);
  const setPassions = (v: PassionKey[]) => update("passions", v);
  const setPassionsDetail = (v: string) => update("passionsDetail", v);
  const setChronotype = (v: ChronotypeKey | null) => update("chronotype", v);
  const setSharingIntent = (v: SharingIntentKey | null) => update("sharingIntent", v);
  const setPriorityDimensions = (v: EnrichmentCategory[]) =>
    update("priorityDimensions", v);
  const setDimensionsDetail = (v: string) => update("dimensionsDetail", v);

  return {
    state,
    update,
    nextStep,
    prevStep,
    goToDeepPhase,
    canAdvance,
    setMotivationChip,
    setMotivationDetail,
    setAgeBand,
    setLifeSituation,
    setLifeSituationDetail,
    setHomePlace,
    setPersonalityTraits,
    setPersonalityDetail,
    setMemoryTreasures,
    setMemoryTreasuresDetail,
    setPassions,
    setPassionsDetail,
    setChronotype,
    setSharingIntent,
    setPriorityDimensions,
    setDimensionsDetail,
  };
}
