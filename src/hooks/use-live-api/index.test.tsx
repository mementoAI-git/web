import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLiveAPI } from ".";

const liveMocks = vi.hoisted(() => ({
  apiKeys: [] as string[],
  close: vi.fn(),
  connect: vi.fn(),
  fetchToken: vi.fn(),
  getUserMedia: vi.fn(),
  stopTrack: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    live = { connect: liveMocks.connect };

    constructor({ apiKey }: { apiKey?: string }) {
      liveMocks.apiKeys.push(apiKey || "");
    }
  },
  Modality: { AUDIO: "AUDIO" },
}));

vi.mock("../use-fetcher", () => ({
  default: (url: string) => ({
    trigger: url.includes("ephemeral-token") ? liveMocks.fetchToken : vi.fn(),
  }),
}));

vi.mock("@/hooks/use-store", () => ({
  useStore: () => ({
    user: { chat_voice: "Kore", chat_voice_provider: "gemini" },
  }),
}));

vi.mock("./playback", () => ({
  createPlaybackState: () => ({ nextStartTime: 0, sources: new Set() }),
  scheduleGeminiLivePcmChunk: vi.fn(),
  stopAllGeminiLivePlayback: vi.fn(),
}));

describe("useLiveAPI", () => {
  beforeEach(() => {
    liveMocks.apiKeys.length = 0;
    liveMocks.close.mockClear();
    liveMocks.getUserMedia.mockReset().mockResolvedValue({
      getAudioTracks: () => [{ enabled: true }],
      getTracks: () => [{ stop: liveMocks.stopTrack }],
    });
    liveMocks.stopTrack.mockClear();
    liveMocks.connect.mockImplementation(async (options: { callbacks: { onmessage: (message: { setupComplete: object }) => void } }) => {
      options.callbacks.onmessage({ setupComplete: {} });
      return { close: liveMocks.close };
    });
    liveMocks.fetchToken
      .mockReset()
      .mockResolvedValueOnce({ data: { token: "token-1" } })
      .mockResolvedValueOnce({ data: { token: "token-2" } })
      .mockResolvedValueOnce({ data: { token: "token-3" } });

    vi.stubGlobal(
      "AudioContext",
      class {
        state = "running";
        destination = {};
        close = vi.fn().mockResolvedValue(undefined);
        resume = vi.fn().mockResolvedValue(undefined);
        createGain() {
          return { connect: vi.fn(), disconnect: vi.fn() };
        }
        createMediaStreamSource() {
          return { connect: vi.fn(), disconnect: vi.fn() };
        }
        createScriptProcessor() {
          return { connect: vi.fn(), disconnect: vi.fn(), onaudioprocess: null };
        }
      },
    );
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia: liveMocks.getUserMedia },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses a fresh ephemeral token and client for every new live session", async () => {
    const { result } = renderHook(() => useLiveAPI({ autoConnect: false }));
    await waitFor(() => expect(result.current.outputNode).not.toBeNull());

    await act(async () => {
      await result.current.connect();
    });
    act(() => result.current.disconnect());
    await act(async () => {
      await result.current.connect({ languageCode: "fr-FR", voiceName: "Aoede" });
    });
    act(() => result.current.disconnect());
    await act(async () => {
      await result.current.connect({ languageCode: "es-ES", voiceName: "Charon" });
    });

    expect(liveMocks.fetchToken).toHaveBeenCalledTimes(3);
    expect(liveMocks.apiKeys).toEqual(["token-1", "token-2", "token-3"]);
    expect(liveMocks.connect).toHaveBeenLastCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          speechConfig: expect.objectContaining({
            languageCode: "es-ES",
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } },
          }),
        }),
      }),
    );
  });

  it("connects with the model the server locked into the token", async () => {
    liveMocks.fetchToken.mockReset().mockResolvedValueOnce({
      data: { token: "auth_tokens/1", live: { model: "gemini-3.8-live" } },
    });
    const { result } = renderHook(() => useLiveAPI({ autoConnect: false }));
    await waitFor(() => expect(result.current.outputNode).not.toBeNull());

    await act(async () => {
      await result.current.connect();
    });

    expect(liveMocks.connect).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gemini-3.8-live" }),
    );
  });

  it("requests the token for the current conversation", async () => {
    const { result } = renderHook(() => useLiveAPI({ memoryId: "m1", autoConnect: false }));
    await waitFor(() => expect(result.current.outputNode).not.toBeNull());

    await act(async () => {
      await result.current.connect();
    });

    expect(liveMocks.fetchToken).toHaveBeenCalledWith({ memory_id: "m1" });
  });

  it("streams microphone audio as realtime audio input", async () => {
    const sendRealtimeInput = vi.fn();
    liveMocks.connect.mockImplementation(async (options: { callbacks: { onmessage: (message: { setupComplete: object }) => void } }) => {
      options.callbacks.onmessage({ setupComplete: {} });
      return { close: liveMocks.close, sendRealtimeInput };
    });
    const processors: { onaudioprocess: ((event: unknown) => void) | null }[] = [];
    const AudioContextStub = globalThis.AudioContext as unknown as { prototype: { createScriptProcessor: () => unknown } };
    AudioContextStub.prototype.createScriptProcessor = () => {
      const processor = { connect: vi.fn(), disconnect: vi.fn(), onaudioprocess: null };
      processors.push(processor);
      return processor;
    };
    const { result } = renderHook(() => useLiveAPI({ autoConnect: false }));
    await waitFor(() => expect(result.current.outputNode).not.toBeNull());

    await act(async () => {
      await result.current.connect();
      await result.current.startRecording();
    });
    await act(async () => {
      processors[0].onaudioprocess?.({ inputBuffer: { getChannelData: () => new Float32Array([0, 0.5]) } });
      await Promise.resolve();
    });

    expect(sendRealtimeInput).toHaveBeenCalledWith({
      audio: expect.objectContaining({ mimeType: "audio/pcm;rate=16000" }),
    });
  });

  it("keeps the microphone stream alive while replacing the live session", async () => {
    const { result } = renderHook(() => useLiveAPI({ autoConnect: false }));
    await waitFor(() => expect(result.current.outputNode).not.toBeNull());

    await act(async () => {
      await result.current.connect();
      await result.current.startRecording();
    });
    await waitFor(() => expect(result.current.isRecording).toBe(true));

    await act(async () => {
      await result.current.restartSession({ languageCode: "fr-FR" });
    });

    expect(result.current.isRecording).toBe(true);
    expect(liveMocks.getUserMedia).toHaveBeenCalledTimes(1);
    expect(liveMocks.stopTrack).not.toHaveBeenCalled();
  });
  it("flushes a microphone turn on mute and stops streaming muted frames", async () => {
    const sendRealtimeInput = vi.fn();
    liveMocks.connect.mockImplementation(async (options: { callbacks: { onmessage: (message: { setupComplete: object }) => void } }) => {
      options.callbacks.onmessage({ setupComplete: {} });
      return { close: liveMocks.close, sendRealtimeInput };
    });
    const processors: { onaudioprocess: ((event: unknown) => void) | null }[] = [];
    const Context = globalThis.AudioContext as unknown as { prototype: { createScriptProcessor: () => unknown } };
    Context.prototype.createScriptProcessor = () => {
      const p = { connect: vi.fn(), disconnect: vi.fn(), onaudioprocess: null };
      processors.push(p);
      return p;
    };
    const {result} = renderHook(() => useLiveAPI({autoConnect: false}));
    await waitFor(() => expect(result.current.outputNode).not.toBeNull());
    await act(async () => { await result.current.connect(); await result.current.startRecording(); });
    await act(async () => { result.current.setInputMuted(true); await Promise.resolve(); });
    expect(sendRealtimeInput).toHaveBeenCalledWith({audioStreamEnd: true});
    const count = sendRealtimeInput.mock.calls.length;
    await act(async () => {
      processors[0].onaudioprocess?.({inputBuffer: {getChannelData: () => new Float32Array(4096).fill(0.1)}});
      await Promise.resolve();
    });
    expect(sendRealtimeInput).toHaveBeenCalledTimes(count);
    await act(async () => { result.current.setInputMuted(false); });
    await act(async () => {
      processors[0].onaudioprocess?.({inputBuffer: {getChannelData: () => new Float32Array(4096).fill(0.1)}});
      await Promise.resolve();
    });
    expect(sendRealtimeInput).toHaveBeenCalledTimes(count + 1);
  });

  it("finalizes repeated spoken turns after a pause without ending the connection", async () => {
    const sendRealtimeInput = vi.fn();
    liveMocks.connect.mockImplementation(async (options: { callbacks: { onmessage: (message: { setupComplete: object }) => void } }) => {
      options.callbacks.onmessage({ setupComplete: {} });
      return { close: liveMocks.close, sendRealtimeInput };
    });
    const processors: { onaudioprocess: ((event: unknown) => void) | null }[] = [];
    const Context = globalThis.AudioContext as unknown as { prototype: { createScriptProcessor: () => unknown } };
    Context.prototype.createScriptProcessor = () => {
      const p = { connect: vi.fn(), disconnect: vi.fn(), onaudioprocess: null };
      processors.push(p);
      return p;
    };
    const {result} = renderHook(() => useLiveAPI({autoConnect: false}));
    await waitFor(() => expect(result.current.outputNode).not.toBeNull());
    await act(async () => { await result.current.connect(); await result.current.startRecording(); });
    const emit = async (value: number) => act(async () => {
      processors[0].onaudioprocess?.({inputBuffer: {getChannelData: () => new Float32Array(4096).fill(value)}});
      await Promise.resolve();
    });
    await emit(0.002);
    for (let turn = 1; turn <= 2; turn++) {
      await emit(0.1);
      for (let pause = 0; pause < 5; pause++) await emit(0.002);
      expect(sendRealtimeInput.mock.calls.filter(([input]) => input.audioStreamEnd)).toHaveLength(turn);
    }
    expect(liveMocks.close).not.toHaveBeenCalled();
    expect(result.current.isRecording).toBe(true);
    expect(result.current.connected).toBe(true);
  });

});
