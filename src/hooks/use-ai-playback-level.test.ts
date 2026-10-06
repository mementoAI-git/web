import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAiPlaybackLevel } from "./use-ai-playback-level";

describe("AI playback meter", () => {
  it("returns silence without an output graph", () => {
    const { result } = renderHook(() => useAiPlaybackLevel(null));
    expect(result.current()).toBe(0);
  });

  it("measures output, clamps levels, and disconnects only the analyser on cleanup", () => {
    let amplitude = 0;
    const analyser = { fftSize: 256, getFloatTimeDomainData: (samples: Float32Array) => samples.fill(amplitude), disconnect: vi.fn() };
    const output = { context: { createAnalyser: () => analyser }, connect: vi.fn(), disconnect: vi.fn() };
    const { result, unmount } = renderHook(() => useAiPlaybackLevel(output as unknown as GainNode));
    expect(output.connect).toHaveBeenCalledWith(analyser);
    expect(result.current()).toBe(0);
    amplitude = 0.1;
    expect(result.current()).toBeCloseTo(0.4);
    amplitude = 0.8;
    expect(result.current()).toBe(1);
    unmount();
    expect(output.disconnect).toHaveBeenCalledWith(analyser);
    expect(result.current()).toBe(0);
  });
});
