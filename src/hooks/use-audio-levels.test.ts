import { renderHook } from "@testing-library/react";
import { useAudioLevels } from "./use-audio-levels";

const BAR_COUNT = 24;
const MIN_HEIGHT = 8;

describe("useAudioLevels", () => {
  it("returns 24 bars at MIN_HEIGHT when stream is null", () => {
    const { result } = renderHook(() => useAudioLevels(null, false));
    expect(result.current).toHaveLength(BAR_COUNT);
    result.current.forEach((h) => expect(h).toBe(MIN_HEIGHT));
  });

  it("returns 24 bars at MIN_HEIGHT when enabled is false", () => {
    const { result } = renderHook(() => useAudioLevels(null, true));
    expect(result.current).toHaveLength(BAR_COUNT);
    result.current.forEach((h) => expect(h).toBe(MIN_HEIGHT));
  });

  it("returns array of numbers in valid height range when disabled", () => {
    const { result } = renderHook(() => useAudioLevels(null, false));
    result.current.forEach((h) => {
      expect(typeof h).toBe("number");
      expect(h).toBeGreaterThanOrEqual(MIN_HEIGHT);
      expect(h).toBeLessThanOrEqual(48);
    });
  });
});
