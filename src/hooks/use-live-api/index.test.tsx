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
    liveMocks.connect.mockImplementation(async (options: { callbacks: { onopen: () => void } }) => {
      options.callbacks.onopen();
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
});
