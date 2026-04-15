import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOnboardQuestionsState } from "./useOnboardQuestionsState";

describe("useOnboardQuestionsState", () => {
  it("adds passion freetext item on addPassionFreetext", () => {
    const { result } = renderHook(() => useOnboardQuestionsState());
    expect(result.current.state.passionsFreetext).toEqual([]);

    act(() => {
      result.current.addPassionFreetext("gardening");
    });
    expect(result.current.state.passionsFreetext).toEqual(["gardening"]);

    act(() => {
      result.current.addPassionFreetext("vintage cars");
    });
    expect(result.current.state.passionsFreetext).toEqual(["gardening", "vintage cars"]);
  });

  it("ignores empty or whitespace-only addPassionFreetext", () => {
    const { result } = renderHook(() => useOnboardQuestionsState());
    act(() => {
      result.current.addPassionFreetext("");
    });
    expect(result.current.state.passionsFreetext).toEqual([]);

    act(() => {
      result.current.addPassionFreetext("   ");
    });
    expect(result.current.state.passionsFreetext).toEqual([]);
  });

  it("trims whitespace when adding passion freetext", () => {
    const { result } = renderHook(() => useOnboardQuestionsState());
    act(() => {
      result.current.addPassionFreetext("  photography  ");
    });
    expect(result.current.state.passionsFreetext).toEqual(["photography"]);
  });

  it("removes passion freetext item on removePassionFreetext", () => {
    const { result } = renderHook(() => useOnboardQuestionsState());
    act(() => {
      result.current.addPassionFreetext("gardening");
      result.current.addPassionFreetext("vintage cars");
    });
    expect(result.current.state.passionsFreetext).toEqual(["gardening", "vintage cars"]);

    act(() => {
      result.current.removePassionFreetext(0);
    });
    expect(result.current.state.passionsFreetext).toEqual(["vintage cars"]);

    act(() => {
      result.current.removePassionFreetext(0);
    });
    expect(result.current.state.passionsFreetext).toEqual([]);
  });

  it("adds mementoFor freetext item on addMementoForFreetext", () => {
    const { result } = renderHook(() => useOnboardQuestionsState());
    expect(result.current.state.mementoForFreetext).toEqual([]);

    act(() => {
      result.current.addMementoForFreetext("my mentor");
    });
    expect(result.current.state.mementoForFreetext).toEqual(["my mentor"]);

    act(() => {
      result.current.addMementoForFreetext("a community");
    });
    expect(result.current.state.mementoForFreetext).toEqual(["my mentor", "a community"]);
  });

  it("requires mementoForFreetext when only something_else selected (step 2)", () => {
    const { result } = renderHook(() => useOnboardQuestionsState());
    expect(result.current.canAdvance(2)).toBe(false);

    act(() => {
      result.current.setMementoFor(["something_else"]);
    });
    expect(result.current.canAdvance(2)).toBe(false);

    act(() => {
      result.current.addMementoForFreetext("my mentor");
    });
    expect(result.current.canAdvance(2)).toBe(true);

    act(() => {
      result.current.setMementoFor(["children", "something_else"]);
    });
    expect(result.current.canAdvance(2)).toBe(true);
  });

  it("requires at least one enrichment priority dimension (step 5)", () => {
    const { result } = renderHook(() => useOnboardQuestionsState());
    expect(result.current.canAdvance(5)).toBe(false);

    act(() => {
      result.current.setPriorityDimensions(["relationships_people"]);
    });
    expect(result.current.canAdvance(5)).toBe(true);
  });

  it("supports All of the above for motivation (step 4)", () => {
    const { result } = renderHook(() => useOnboardQuestionsState());
    expect(result.current.state.motivationType).toBeNull();
    expect(result.current.canAdvance(4)).toBe(false);

    act(() => {
      result.current.setMotivationType("__all__");
    });
    expect(result.current.state.motivationType).toBe("__all__");
    expect(result.current.canAdvance(4)).toBe(true);

    act(() => {
      result.current.setMotivationType(null);
    });
    expect(result.current.state.motivationType).toBeNull();
  });
});
