import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOnboardQuestionsState } from "./useOnboardQuestionsState";

describe("useOnboardQuestionsState", () => {
  it("starts at step 1", () => {
    const { result } = renderHook(() => useOnboardQuestionsState());
    expect(result.current.state.step).toBe(1);
  });

  it("requires motivation on step 1", () => {
    const { result } = renderHook(() => useOnboardQuestionsState());
    expect(result.current.canAdvance(1)).toBe(false);
    act(() => {
      result.current.setMotivationChip("explorer");
    });
    expect(result.current.canAdvance(1)).toBe(true);
  });

  it("requires motivation detail when something_else", () => {
    const { result } = renderHook(() => useOnboardQuestionsState());
    act(() => {
      result.current.setMotivationChip("something_else");
    });
    expect(result.current.canAdvance(1)).toBe(false);
    act(() => {
      result.current.setMotivationDetail("  curious  ");
    });
    expect(result.current.canAdvance(1)).toBe(true);
  });

  it("advances from branch to deep phase on goToDeepPhase", () => {
    const { result } = renderHook(() => useOnboardQuestionsState());
    act(() => {
      result.current.update("step", 6);
    });
    expect(result.current.state.step).toBe(6);
    act(() => {
      result.current.goToDeepPhase();
    });
    expect(result.current.state.step).toBe(7);
    expect(result.current.state.skippedDeepPersonalization).toBe(false);
  });

  it("caps personality traits at 2 via setter usage", () => {
    const { result } = renderHook(() => useOnboardQuestionsState());
    act(() => {
      result.current.setPersonalityTraits(["warm_caring", "funny_lighthearted"]);
    });
    expect(result.current.state.personalityTraits).toHaveLength(2);
  });

  it("requires home text on step 4", () => {
    const { result } = renderHook(() => useOnboardQuestionsState());
    expect(result.current.canAdvance(4)).toBe(false);
    act(() => {
      result.current.setHomePlace("  Lisbon  ");
    });
    expect(result.current.canAdvance(4)).toBe(true);
  });

  it("hydrates from an initial misc revisit state", () => {
    const { result } = renderHook(() =>
      useOnboardQuestionsState({
        step: 12,
        motivationChip: "memory_preservation",
        homePlace: "Lagos",
        chronotype: "night",
      }),
    );

    expect(result.current.state.step).toBe(12);
    expect(result.current.state.motivationChip).toBe("memory_preservation");
    expect(result.current.state.homePlace).toBe("Lagos");
    expect(result.current.state.chronotype).toBe("night");
  });

  it("hydrates when revisit state arrives after first render", () => {
    const { result, rerender } = renderHook(
      ({ initialState }: { initialState?: Parameters<typeof useOnboardQuestionsState>[0] }) =>
        useOnboardQuestionsState(initialState),
      { initialProps: { initialState: undefined } },
    );

    expect(result.current.state.step).toBe(1);

    rerender({
      initialState: {
        step: 12,
        homePlace: "Lagos",
        chronotype: "night",
      },
    });

    expect(result.current.state.step).toBe(12);
    expect(result.current.state.homePlace).toBe("Lagos");
    expect(result.current.state.chronotype).toBe("night");
  });
});
