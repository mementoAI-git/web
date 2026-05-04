import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { previewGeminiChatVoice } from "./gemini-voice-preview";

const mockSendClientContent = vi.fn();
const mockClose = vi.fn();

const { mockConnect } = vi.hoisted(() => {
  const mockConnect = vi.fn(async (_opts: { callbacks: { onmessage?: (m: unknown) => void } }) => {
    return {
      sendClientContent: (...args: unknown[]) => mockSendClientContent(...args),
      close: mockClose,
    };
  });
  return { mockConnect };
});

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    live = {
      connect: mockConnect,
    };
  },
  Modality: { AUDIO: "AUDIO" },
}));

vi.mock("@/hooks/use-live-api/config", () => ({
  GEMINI_CONFIG: { MODEL: "test-model" },
}));

vi.mock("@/hooks/use-live-api/playback", () => ({
  createPlaybackState: () => ({ nextStartTime: 0, sources: new Set() }),
  scheduleGeminiLivePcmChunk: vi.fn().mockResolvedValue(undefined),
  stopAllGeminiLivePlayback: vi.fn(),
  waitGeminiLivePlaybackTail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/voice-preview-passages", () => ({
  pickRandomVoicePreviewPassage: () => "Fixed passage for unit test.",
}));

describe("previewGeminiChatVoice", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "AudioContext",
      class {
        state = "running";
        currentTime = 0;
        destination = {};
        async resume() {}
        async close() {}
        createGain() {
          return {
            gain: { value: 1 },
            connect: vi.fn(),
            disconnect: vi.fn(),
          };
        }
      },
    );
    mockSendClientContent.mockImplementation(() => {
      queueMicrotask(() => {
        const lastCall = mockConnect.mock.calls.at(-1)?.[0] as {
          callbacks?: { onmessage?: (m: unknown) => void };
        };
        lastCall?.callbacks?.onmessage?.({
          serverContent: { turnComplete: true, modelTurn: { parts: [] } },
        });
      });
    });
    mockConnect.mockClear();
    mockSendClientContent.mockClear();
    mockClose.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("throws when Web Audio is unavailable", async () => {
    vi.unstubAllGlobals();
    await expect(
      previewGeminiChatVoice({
        voiceName: "Aoede",
        fetchToken: async () => "tok",
      }),
    ).rejects.toThrow("Web Audio API is not available");
  });

  it("throws when token is missing", async () => {
    await expect(
      previewGeminiChatVoice({
        voiceName: "Aoede",
        fetchToken: async () => null,
      }),
    ).rejects.toThrow("Missing voice preview token");
  });

  it("connects, sends preview line, and completes on turnComplete", async () => {
    const fetchToken = vi.fn().mockResolvedValue("ephemeral-token");

    await previewGeminiChatVoice({
      voiceName: "Charon",
      fetchToken,
    });

    expect(fetchToken).toHaveBeenCalled();
    expect(mockConnect).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "test-model",
        config: expect.objectContaining({
          speechConfig: expect.objectContaining({
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } },
          }),
        }),
      }),
    );
    expect(mockSendClientContent).toHaveBeenCalledWith(
      expect.objectContaining({
        turns: expect.arrayContaining([
          expect.objectContaining({
            role: "user",
            parts: [{ text: "Fixed passage for unit test." }],
          }),
        ]),
        turnComplete: true,
      }),
    );
  });

  it("aborts when signal is already aborted", async () => {
    const ac = new AbortController();
    ac.abort();
    await expect(
      previewGeminiChatVoice({
        voiceName: "Aoede",
        fetchToken: async () => "t",
        signal: ac.signal,
      }),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});
