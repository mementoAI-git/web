import { useState, useEffect, useCallback } from "react";
import { storageKeys } from "@/utility/constant";
import type {
  OnboardingState,
  OnboardingStep,
  AgeBand,
  MementoFor,
  PassionKey,
  LifeContextKey,
  MotivationType,
  EnrichmentCategory,
  ExpressionMode,
} from "./types";

const INITIAL_STATE: OnboardingState = {
  currentStep: 1,
  fullName: "",
  displayName: "",
  ageBand: null,
  whereFrom: "",
  mementoFor: [],
  passions: [],
  passionsFreetext: "",
  lifeContext: [],
  motivationType: null,
  priorityDimensions: [],
  expressionMode: [],
  isComplete: false,
  isRevisitMode: false,
};

export interface ValidationErrors {
  fullName?: string;
  displayName?: string;
  ageBand?: string;
  mementoFor?: string;
  passions?: string;
  lifeContext?: string;
  motivation?: string;
  dimensions?: string;
  expression?: string;
}

function migrateState(parsed: Record<string, unknown>): OnboardingState | null {
  const hasOldShape =
    "hostArchetype" in parsed &&
    !("fullName" in parsed) &&
    "displayName" in parsed;
  if (hasOldShape && typeof parsed.displayName === "string") {
    return {
      ...INITIAL_STATE,
      fullName: parsed.displayName as string,
      displayName: parsed.displayName as string,
      currentStep: 1,
    };
  }
  return null;
}

function loadState(): OnboardingState | null {
  try {
    const raw = localStorage.getItem(storageKeys.onboardingState);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed.isComplete) return null;
    const migrated = migrateState(parsed);
    if (migrated) return migrated;
    return parsed as unknown as OnboardingState;
  } catch {
    return null;
  }
}

function saveState(state: OnboardingState): void {
  try {
    if (state.isComplete) {
      localStorage.removeItem(storageKeys.onboardingState);
    } else {
      localStorage.setItem(storageKeys.onboardingState, JSON.stringify(state));
    }
  } catch {
    // ignore
  }
}

export interface UseOnboardingStateOptions {
  initialState?: Partial<OnboardingState>;
}

export function useOnboardingState(options: UseOnboardingStateOptions = {}) {
  const [state, setState] = useState<OnboardingState>(() => {
    const saved = loadState();
    if (saved) return saved;
    return { ...INITIAL_STATE, ...options.initialState };
  });

  useEffect(() => {
    saveState(state);
  }, [state]);

  const updateField = useCallback(<K extends keyof OnboardingState>(
    key: K,
    value: OnboardingState[K]
  ) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const advanceStep = useCallback(() => {
    setState((prev) => {
      if (prev.currentStep >= 8) return prev;
      return { ...prev, currentStep: (prev.currentStep + 1) as OnboardingStep };
    });
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => {
      if (prev.currentStep <= 1) return prev;
      return { ...prev, currentStep: (prev.currentStep - 1) as OnboardingStep };
    });
  }, []);

  const complete = useCallback(() => {
    setState((prev) => ({ ...prev, isComplete: true }));
  }, []);

  const skip = useCallback(() => {}, []);

  const canAdvance = useCallback((step: OnboardingStep): boolean => {
    switch (step) {
      case 1:
        return (
          state.fullName.trim().length > 0 && state.displayName.trim().length > 0
        );
      case 2:
        return state.ageBand !== null && state.mementoFor.length >= 1;
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
  }, [
    state.fullName,
    state.displayName,
    state.ageBand,
    state.mementoFor,
    state.passions,
    state.lifeContext,
    state.motivationType,
    state.priorityDimensions,
    state.expressionMode,
  ]);

  const validationErrors = useCallback(
    (step: OnboardingStep): ValidationErrors => {
      const errors: ValidationErrors = {};
      switch (step) {
        case 1:
          if (!state.fullName.trim())
            errors.fullName = "We'd love to know your full name.";
          if (!state.displayName.trim())
            errors.displayName = "We'd love to know what to call you.";
          break;
        case 2:
          if (!state.ageBand)
            errors.ageBand = "Please pick an age range — it helps us tailor prompts.";
          if (state.mementoFor.length < 1)
            errors.mementoFor = "Please pick at least one — who is this for?";
          break;
        case 3:
          if (state.passions.length < 1)
            errors.passions = "Pick at least one — we'll use these to personalize prompts.";
          break;
        case 4:
          if (state.lifeContext.length < 1)
            errors.lifeContext = "Please pick at least one — it helps us understand where you are.";
          break;
        case 5:
          if (!state.motivationType)
            errors.motivation = "Please choose the one that feels most like you.";
          break;
        case 6:
          if (state.priorityDimensions.length < 1)
            errors.dimensions = "Even just one is a great place to start.";
          break;
        case 7:
          if (state.expressionMode.length < 1)
            errors.expression =
              "Pick at least one — you can always change it later.";
          break;
      }
      return errors;
    },
    [
      state.fullName,
      state.displayName,
      state.ageBand,
      state.mementoFor,
      state.passions,
      state.lifeContext,
      state.motivationType,
      state.priorityDimensions,
      state.expressionMode,
    ]
  );

  return {
    state,
    setState,
    updateField,
    advanceStep,
    goBack,
    complete,
    skip,
    canAdvance,
    validationErrors,
    setFullName: (v: string) => updateField("fullName", v),
    setDisplayName: (v: string) => updateField("displayName", v),
    setAgeBand: (v: AgeBand | null) => updateField("ageBand", v),
    setWhereFrom: (v: string) => updateField("whereFrom", v),
    setMementoFor: (v: MementoFor[]) => updateField("mementoFor", v),
    setPassions: (v: PassionKey[]) => updateField("passions", v),
    setPassionsFreetext: (v: string) => updateField("passionsFreetext", v),
    setLifeContext: (v: LifeContextKey[]) => updateField("lifeContext", v),
    setMotivationType: (v: MotivationType | null) => updateField("motivationType", v),
    setPriorityDimensions: (v: EnrichmentCategory[]) =>
      updateField("priorityDimensions", v),
    setExpressionMode: (v: ExpressionMode[]) => updateField("expressionMode", v),
  };
}
