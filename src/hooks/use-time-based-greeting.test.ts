import { renderHook } from "@testing-library/react";
import { useTimeBasedGreeting } from "./use-time-based-greeting";

describe("useTimeBasedGreeting", () => {
  it("returns a non-empty greeting string", () => {
    const { result } = renderHook(() => useTimeBasedGreeting());
    expect(result.current).toBeTruthy();
    expect(typeof result.current).toBe("string");
    expect(result.current.length).toBeGreaterThan(5);
  });

  it("returns a greeting that contains a question or prompt", () => {
    const { result } = renderHook(() => useTimeBasedGreeting());
    const greeting = result.current;
    const hasQuestion =
      greeting.includes("?") ||
      greeting.toLowerCase().includes("what") ||
      greeting.toLowerCase().includes("mind");
    expect(hasQuestion).toBe(true);
  });
});
