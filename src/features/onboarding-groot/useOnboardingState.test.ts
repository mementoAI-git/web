import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOnboardingState } from "./useOnboardingState";
import { storageKeys } from "@/utility/constant";

describe("useOnboardingState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns initial state", () => {
    const { result } = renderHook(() => useOnboardingState());
    expect(result.current.state.currentStep).toBe(1);
    expect(result.current.state.fullName).toBe("");
    expect(result.current.state.displayName).toBe("");
    expect(result.current.state.ageBand).toBeNull();
    expect(result.current.state.motivationType).toBeNull();
    expect(result.current.state.priorityDimensions).toEqual([]);
    expect(result.current.state.expressionMode).toEqual([]);
    expect(result.current.state.isComplete).toBe(false);
  });

  it("advanceStep increments currentStep", () => {
    const { result } = renderHook(() => useOnboardingState());
    act(() => {
      result.current.advanceStep();
    });
    expect(result.current.state.currentStep).toBe(2);
    act(() => {
      result.current.advanceStep();
    });
    expect(result.current.state.currentStep).toBe(3);
  });

  it("goBack decrements currentStep", () => {
    const { result } = renderHook(() => useOnboardingState());
    act(() => {
      result.current.advanceStep();
      result.current.advanceStep();
    });
    expect(result.current.state.currentStep).toBe(3);
    act(() => {
      result.current.goBack();
    });
    expect(result.current.state.currentStep).toBe(2);
    act(() => {
      result.current.goBack();
    });
    expect(result.current.state.currentStep).toBe(1);
  });

  it("persists to localStorage on advance", () => {
    const { result } = renderHook(() => useOnboardingState());
    act(() => {
      result.current.setFullName("Jane Doe");
      result.current.setDisplayName("Jane");
      result.current.setAgeBand("30s_40s");
      result.current.setMementoFor(["children"]);
      result.current.advanceStep();
    });
    const raw = localStorage.getItem(storageKeys.onboardingState);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.currentStep).toBe(2);
    expect(parsed.displayName).toBe("Jane");
  });

  it("restores from localStorage on init", () => {
    const saved = {
      currentStep: 5,
      fullName: "Jane Doe",
      displayName: "Jane",
      ageBand: "30s_40s",
      whereFrom: "",
      mementoFor: ["children"],
      passions: ["music"],
      passionsFreetext: "",
      lifeContext: ["still_working"],
      motivationType: "emotional_depth",
      priorityDimensions: ["relationships_people"],
      expressionMode: ["voice"],
      isComplete: false,
      isRevisitMode: false,
    };
    localStorage.setItem(storageKeys.onboardingState, JSON.stringify(saved));

    const { result } = renderHook(() => useOnboardingState());
    expect(result.current.state.currentStep).toBe(5);
    expect(result.current.state.displayName).toBe("Jane");
    expect(result.current.state.motivationType).toBe("emotional_depth");
  });

  it("does not restore when isComplete is true", () => {
    const saved = {
      currentStep: 8,
      fullName: "Jane",
      displayName: "Jane",
      ageBand: "30s_40s",
      whereFrom: "",
      mementoFor: ["children"],
      passions: [],
      passionsFreetext: "",
      lifeContext: ["still_working"],
      motivationType: "emotional_depth",
      priorityDimensions: ["relationships_people"],
      expressionMode: ["voice"],
      isComplete: true,
      isRevisitMode: false,
    };
    localStorage.setItem(storageKeys.onboardingState, JSON.stringify(saved));

    const { result } = renderHook(() => useOnboardingState());
    expect(result.current.state.currentStep).toBe(1);
  });

  it("canAdvance returns false for step 1 when fullName or displayName empty", () => {
    const { result } = renderHook(() => useOnboardingState());
    expect(result.current.canAdvance(1)).toBe(false);
    act(() => {
      result.current.setFullName("Jane Doe");
    });
    expect(result.current.canAdvance(1)).toBe(false);
    act(() => {
      result.current.setDisplayName("Jane");
    });
    expect(result.current.canAdvance(1)).toBe(true);
  });

  it("canAdvance returns correct value for step 2", () => {
    const { result } = renderHook(() => useOnboardingState());
    expect(result.current.canAdvance(2)).toBe(false);
    act(() => {
      result.current.setAgeBand("30s_40s");
      result.current.setMementoFor(["children"]);
    });
    expect(result.current.canAdvance(2)).toBe(true);
  });

  it("canAdvance returns correct value for step 3", () => {
    const { result } = renderHook(() => useOnboardingState());
    expect(result.current.canAdvance(3)).toBe(false);
    act(() => {
      result.current.setPassions(["music"]);
    });
    expect(result.current.canAdvance(3)).toBe(true);
  });

  it("canAdvance returns correct value for step 4", () => {
    const { result } = renderHook(() => useOnboardingState());
    expect(result.current.canAdvance(4)).toBe(false);
    act(() => {
      result.current.setLifeContext(["still_working"]);
    });
    expect(result.current.canAdvance(4)).toBe(true);
  });

  it("canAdvance returns correct value for step 5", () => {
    const { result } = renderHook(() => useOnboardingState());
    expect(result.current.canAdvance(5)).toBe(false);
    act(() => {
      result.current.setMotivationType("emotional_depth");
    });
    expect(result.current.canAdvance(5)).toBe(true);
  });

  it("canAdvance always true for step 8", () => {
    const { result } = renderHook(() => useOnboardingState());
    expect(result.current.canAdvance(8)).toBe(true);
  });

  it("validationErrors returns messages for step 1", () => {
    const { result } = renderHook(() => useOnboardingState());
    let errors = result.current.validationErrors(1);
    expect(errors.fullName).toBe("We'd love to know your full name.");
    expect(errors.displayName).toBe("We'd love to know what to call you.");

    act(() => {
      result.current.setFullName("Jane Doe");
    });
    errors = result.current.validationErrors(1);
    expect(errors.fullName).toBeUndefined();
    expect(errors.displayName).toBe("We'd love to know what to call you.");

    act(() => {
      result.current.setDisplayName("Jane");
    });
    errors = result.current.validationErrors(1);
    expect(errors.fullName).toBeUndefined();
    expect(errors.displayName).toBeUndefined();
  });

  it("validationErrors returns message for step 2", () => {
    const { result } = renderHook(() => useOnboardingState());
    const errors = result.current.validationErrors(2);
    expect(errors.ageBand).toBe(
      "Please pick an age range — it helps us tailor prompts."
    );
    expect(errors.mementoFor).toBe("Please pick at least one — who is this for?");
  });

  it("validationErrors returns message for step 3", () => {
    const { result } = renderHook(() => useOnboardingState());
    const errors = result.current.validationErrors(3);
    expect(errors.passions).toBe(
      "Pick at least one — we'll use these to personalize prompts."
    );
  });

  it("validationErrors returns message for step 4", () => {
    const { result } = renderHook(() => useOnboardingState());
    const errors = result.current.validationErrors(4);
    expect(errors.lifeContext).toBe(
      "Please pick at least one — it helps us understand where you are."
    );
  });

  it("validationErrors returns message for step 7", () => {
    const { result } = renderHook(() => useOnboardingState());
    const errors = result.current.validationErrors(7);
    expect(errors.expression).toBe(
      "Pick at least one — you can always change it later."
    );
  });

  it("complete sets isComplete and clears localStorage", () => {
    const { result } = renderHook(() => useOnboardingState());
    act(() => {
      result.current.advanceStep();
    });
    expect(localStorage.getItem(storageKeys.onboardingState)).toBeTruthy();
    act(() => {
      result.current.complete();
    });
    expect(result.current.state.isComplete).toBe(true);
    expect(localStorage.getItem(storageKeys.onboardingState)).toBeNull();
  });

  it("accepts initialState for revisit mode", () => {
    const { result } = renderHook(() =>
      useOnboardingState({
        initialState: {
          displayName: "Jane",
          fullName: "Jane Doe",
          motivationType: "emotional_depth",
          isRevisitMode: true,
        },
      })
    );
    expect(result.current.state.displayName).toBe("Jane");
    expect(result.current.state.fullName).toBe("Jane Doe");
    expect(result.current.state.motivationType).toBe("emotional_depth");
    expect(result.current.state.isRevisitMode).toBe(true);
  });
});
