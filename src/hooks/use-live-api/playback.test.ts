import { describe, expect, it, vi } from "vitest";
import { createPlaybackState, stopAllGeminiLivePlayback, scheduleGeminiLivePcmChunk } from "./playback";

describe("Gemini live playback helpers", () => {
  it("createPlaybackState seeds nextStartTime from the audio context clock", () => {
    const ctx = { currentTime: 1.5 } as AudioContext;
    const state = createPlaybackState(ctx);
    expect(state.nextStartTime).toBe(1.5);
    expect(state.sources.size).toBe(0);
  });

  it("resumes a suspended output context before scheduling speech", async () => {
    const source = { connect: vi.fn(), addEventListener: vi.fn(), start: vi.fn(), buffer: null };
    const context = { state: "suspended", currentTime: 0, resume: vi.fn(async () => { context.state = "running"; }), createBuffer: () => ({ copyToChannel: vi.fn(), duration: 1 / 24000 }), createBufferSource: () => source };
    await scheduleGeminiLivePcmChunk("AAA=", context as unknown as AudioContext, {} as AudioNode, createPlaybackState(context as unknown as AudioContext));
    expect(context.resume).toHaveBeenCalledOnce();
    expect(source.start).toHaveBeenCalledOnce();
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
