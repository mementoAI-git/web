import { describe, expect, it, vi } from "vitest";
import { createPlaybackState, stopAllGeminiLivePlayback } from "./playback";

describe("Gemini live playback helpers", () => {
  it("createPlaybackState seeds nextStartTime from the audio context clock", () => {
    const ctx = { currentTime: 1.5 } as AudioContext;
    const state = createPlaybackState(ctx);
    expect(state.nextStartTime).toBe(1.5);
    expect(state.sources.size).toBe(0);
  });

  it("stopAllGeminiLivePlayback stops sources and clears the queue", () => {
    const mockSource = { stop: vi.fn() };
    const state = {
      nextStartTime: 5,
      sources: new Set([mockSource as unknown as AudioBufferSourceNode]),
    };
    stopAllGeminiLivePlayback(state);
    expect(mockSource.stop).toHaveBeenCalledOnce();
    expect(state.sources.size).toBe(0);
    expect(state.nextStartTime).toBe(0);
  });
});
