import { useState, useCallback } from "react";
import type {
  AgeBand,
  MementoFor,
  PassionKey,
  LifeContextKey,
  MotivationType,
  DimensionKey,
  ExpressionMode,
} from "@/features/onboarding-groot/types";

export type OnboardQuestionsStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const ONBOARD_QUESTIONS_STEP_LABELS: Record<OnboardQuestionsStep, string> = {
  1: "Let's get started",
  2: "Who is this for?",
  3: "What you love",
  4: "Your life right now",
  5: "What brings you here",
  6: "What matters most",
  7: "How you'll add to Memento",
  8: "You're all set",
};

export interface OnboardQuestionsState {
  step: OnboardQuestionsStep;
  ageBand: AgeBand | null;
  whereFrom: string;
  mementoFor: MementoFor[];
  passions: PassionKey[];
  passionsFreetext: string;
  lifeContext: LifeContextKey[];
  motivationType: MotivationType | null;
  priorityDimensions: DimensionKey[];
  expressionMode: ExpressionMode[];
}

const INITIAL: OnboardQuestionsState = {
  step: 1,
  ageBand: null,
  whereFrom: "",
  mementoFor: [],
  passions: [],
  passionsFreetext: "",
  lifeContext: [],
  motivationType: null,
  priorityDimensions: [],
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
      if (prev.step >= 8) return prev;
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
        return state.mementoFor.length >= 1;
      case 3:
        return state.passions.length >= 1;
      case 4:
        return state.lifeContext.length >= 1;
      case 5:
        return state.motivationType !== null;
      case 6:
        return state.priorityDimensions.length >= 1;
      case 7:
        return state.expressionMode.length >= 1;
      case 8:
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
    setPassions: (v: PassionKey[]) => update("passions", v),
    setPassionsFreetext: (v: string) => update("passionsFreetext", v),
    setLifeContext: (v: LifeContextKey[]) => update("lifeContext", v),
    setMotivationType: (v: MotivationType | null) => update("motivationType", v),
    setPriorityDimensions: (v: DimensionKey[]) => update("priorityDimensions", v),
    setExpressionMode: (v: ExpressionMode[]) => update("expressionMode", v),
  };
}
