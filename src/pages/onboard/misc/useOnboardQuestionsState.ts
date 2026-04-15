import { useState, useCallback } from "react";
import type {
  AgeBand,
  MementoFor,
  PassionKey,
  LifeContextKey,
  MotivationType,
  EnrichmentCategory,
  ExpressionMode,
} from "@/features/onboarding-groot/types";

export type OnboardQuestionsStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const ONBOARD_QUESTIONS_STEP_LABELS: Record<OnboardQuestionsStep, string> = {
  1: "Let's get started",
  2: "Who is this for?",
  3: "What you love",
  4: "What brings you here",
  5: "What matters most",
  6: "How you'll add to Memento",
  7: "You're all set",
};

export interface OnboardQuestionsState {
  step: OnboardQuestionsStep;
  ageBand: AgeBand | null;
  whereFrom: string;
  mementoFor: MementoFor[];
  mementoForFreetext: string[];
  passions: PassionKey[];
  passionsFreetext: string[];
  lifeContext: LifeContextKey[];
  motivationType: MotivationType | "__all__" | null;
  priorityDimensions: EnrichmentCategory[];
  dimensionsFreetext: string[];
  expressionMode: ExpressionMode[];
}

const INITIAL: OnboardQuestionsState = {
  step: 1,
  ageBand: null,
  whereFrom: "",
  mementoFor: [],
  mementoForFreetext: [],
  passions: [],
  passionsFreetext: [],
  lifeContext: [],
  motivationType: null,
  priorityDimensions: [],
  dimensionsFreetext: [],
  expressionMode: [],
};

export function useOnboardQuestionsState() {
  const [state, setState] = useState<OnboardQuestionsState>(INITIAL);

  const update = useCallback(<K extends keyof OnboardQuestionsState>(
    key: K,
    value: OnboardQuestionsState[K]
  ) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => {
      if (prev.step >= 7) return prev;
      return { ...prev, step: (prev.step + 1) as OnboardQuestionsStep };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => {
      if (prev.step <= 1) return prev;
      return { ...prev, step: (prev.step - 1) as OnboardQuestionsStep };
    });
  }, []);

  const canAdvance = useCallback((step: OnboardQuestionsStep): boolean => {
    switch (step) {
      case 1:
        return state.ageBand !== null;
      case 2:
        if (state.mementoFor.length < 1) return false;
        if (state.mementoFor.includes("something_else") && state.mementoFor.length === 1) {
          return state.mementoForFreetext.length >= 1;
        }
        return true;
      case 3:
        return state.passions.length >= 1;
      case 4:
        return state.motivationType !== null;
      case 5:
        return state.priorityDimensions.length >= 1;
      case 6:
        return state.expressionMode.length >= 1;
      case 7:
        return true;
      default:
        return false;
    }
  }, [state]);

  return {
    state,
    update,
    nextStep,
    prevStep,
    canAdvance,
    setAgeBand: (v: AgeBand | null) => update("ageBand", v),
    setWhereFrom: (v: string) => update("whereFrom", v),
    setMementoFor: (v: MementoFor[]) => update("mementoFor", v),
    addMementoForFreetext: (item: string) => {
      const trimmed = item.trim();
      if (!trimmed) return;
      setState((prev) => ({
        ...prev,
        mementoForFreetext: [...prev.mementoForFreetext, trimmed],
      }));
    },
    removeMementoForFreetext: (index: number) => {
      setState((prev) => ({
        ...prev,
        mementoForFreetext: prev.mementoForFreetext.filter((_, i) => i !== index),
      }));
    },
    setPassions: (v: PassionKey[]) => update("passions", v),
    setPassionsFreetext: (v: string[]) => update("passionsFreetext", v),
    addPassionFreetext: (item: string) => {
      const trimmed = item.trim();
      if (!trimmed) return;
      setState((prev) => ({
        ...prev,
        passionsFreetext: [...prev.passionsFreetext, trimmed],
      }));
    },
    removePassionFreetext: (index: number) => {
      setState((prev) => ({
        ...prev,
        passionsFreetext: prev.passionsFreetext.filter((_, i) => i !== index),
      }));
    },
    setLifeContext: (v: LifeContextKey[]) => update("lifeContext", v),
    setMotivationType: (v: MotivationType | "__all__" | null) => update("motivationType", v),
    setPriorityDimensions: (v: EnrichmentCategory[]) => update("priorityDimensions", v),
    addDimensionsFreetext: (item: string) => {
      const trimmed = item.trim();
      if (!trimmed) return;
      setState((prev) => ({
        ...prev,
        dimensionsFreetext: [...prev.dimensionsFreetext, trimmed],
      }));
    },
    removeDimensionsFreetext: (index: number) => {
      setState((prev) => ({
        ...prev,
        dimensionsFreetext: prev.dimensionsFreetext.filter((_, i) => i !== index),
      }));
    },
    setExpressionMode: (v: ExpressionMode[]) => update("expressionMode", v),
  };
}
