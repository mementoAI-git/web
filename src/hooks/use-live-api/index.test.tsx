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
  post: vi.fn(),
}));

vi.mock("@/api/mutations", () => ({ post: liveMocks.post }));

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
  waitGeminiLivePlaybackTail: vi.fn().mockResolvedValue(undefined),
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

    expect(liveMocks.fetchToken).toHaveBeenCalledWith(expect.objectContaining({ memory_id: "m1" }));
    // No tool controls from the screen: no tools asked for.
    expect(liveMocks.fetchToken.mock.calls[0][0]).not.toHaveProperty("capabilities");
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

  describe("voice tools", () => {
    type Message = Record<string, unknown>;
    let onmessage: (message: Message) => Promise<void> | void;
    let sendToolResponse: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      sendToolResponse = vi.fn();
      liveMocks.post.mockReset();
      liveMocks.connect.mockImplementation(async (options: { callbacks: { onmessage: typeof onmessage } }) => {
        onmessage = options.callbacks.onmessage;
        await onmessage({ setupComplete: {} });
        return { close: liveMocks.close, sendRealtimeInput: vi.fn(), sendToolResponse };
      });
      liveMocks.fetchToken.mockReset().mockResolvedValue({
        data: { token: "token-1", tools: ["search_memories", "end_call", "set_microphone", "open_screen", "rename_story"] },
      });
    });

    const controls = () => ({ navigate: vi.fn(), openModal: vi.fn(), setMuted: vi.fn(), endCall: vi.fn(), goBack: vi.fn(), canGoBack: vi.fn(() => true) });

    async function connected(toolControls: ReturnType<typeof controls>) {
      const hook = renderHook(() => useLiveAPI({ memoryId: "m1", autoConnect: false, toolControls }));
      await waitFor(() => expect(hook.result.current.outputNode).not.toBeNull());
      await act(async () => {
        await hook.result.current.connect();
      });
      return hook;
    }

    it("asks for the tools web can carry out when the screen provides controls", async () => {
      await connected(controls());
      expect(liveMocks.fetchToken).toHaveBeenCalledWith(expect.objectContaining({
        memory_id: "m1",
        capabilities: "search_memories,call_actions,server_tools,screen_control,screen_fields",
      }));
    });

    it("runs a server tool with its call id and the call's session id, and answers Gemini", async () => {
      liveMocks.post.mockResolvedValue({ data: { result: "Renamed to Homecoming.", effects: [{ type: "open_story", id: "64b7f0c2a1b2c3d4e5f60718" }] } });
      const c = controls();
      await connected(c);

      await act(async () => {
        await onmessage({ toolCall: { functionCalls: [{ id: "call-9", name: "rename_story", args: { title: "Homecoming" } }] } });
      });

      expect(liveMocks.post).toHaveBeenCalledWith("/ai/voice/tools/rename_story", {
        args: { title: "Homecoming" },
        call_id: "call-9",
        session_id: expect.any(String),
      });
      await waitFor(() => expect(sendToolResponse).toHaveBeenCalledWith({
        functionResponses: [{ id: "call-9", name: "rename_story", response: { result: "Renamed to Homecoming." } }],
      }));
      expect(c.navigate).toHaveBeenCalledWith("/stories/64b7f0c2a1b2c3d4e5f60718");
    });

    it("searches memories through the API", async () => {
      liveMocks.post.mockResolvedValue({ data: { result: "Emeka is your brother." } });
      await connected(controls());

      await act(async () => {
        await onmessage({ toolCall: { functionCalls: [{ id: "s1", name: "search_memories", args: { query: "brother", also: ["Emeka"] } }] } });
      });

      expect(liveMocks.post).toHaveBeenCalledWith("/ai/voice/memory-search", { query: "brother", also: ["Emeka"] });
      await waitFor(() => expect(sendToolResponse).toHaveBeenCalledWith({
        functionResponses: [{ id: "s1", name: "search_memories", response: { result: "Emeka is your brother." } }],
      }));
    });

    it("lets Memento look at the page", async () => {
      await connected(controls());
      await act(async () => {
        await onmessage({ toolCall: { functionCalls: [{ id: "l", name: "look_at_screen", args: {} }] } });
      });
      await waitFor(() => expect(sendToolResponse).toHaveBeenCalledWith({
        functionResponses: [{ id: "l", name: "look_at_screen", response: { result: expect.stringMatching(/^Screen: /) } }],
      }));
    });

    it("goes back through the screen's history", async () => {
      const c = controls();
      await connected(c);
      await act(async () => {
        await onmessage({ toolCall: { functionCalls: [{ id: "b", name: "go_back", args: {} }] } });
      });
      await waitFor(() => expect(c.goBack).toHaveBeenCalledOnce());
    });

    it("opens a new story in its modal while the call continues", async () => {
      const c = controls();
      await connected(c);
      await act(async () => {
        await onmessage({ toolCall: { functionCalls: [{ id: "o", name: "open_screen", args: { destination: "new_story", keep_talking: true } }] } });
      });
      expect(c.openModal).toHaveBeenCalledWith("create-memory");
      expect(c.navigate).not.toHaveBeenCalled();
    });

    it("opens a modal a server tool asks for", async () => {
      liveMocks.post.mockResolvedValue({ data: { result: "Done.", effects: [{ type: "open", destination: "quick_note" }] } });
      const c = controls();
      await connected(c);
      await act(async () => {
        await onmessage({ toolCall: { functionCalls: [{ id: "q", name: "rename_story", args: { title: "x" } }] } });
      });
      await waitFor(() => expect(c.openModal).toHaveBeenCalledWith("quick-capture"));
    });

    it("mutes the host when Memento is asked to", async () => {
      const c = controls();
      await connected(c);
      await act(async () => {
        await onmessage({ toolCall: { functionCalls: [{ id: "m", name: "set_microphone", args: { muted: true } }] } });
      });
      expect(c.setMuted).toHaveBeenCalledWith(true);
    });

    it("hangs up only after the goodbye has played", async () => {
      const c = controls();
      await connected(c);
      await act(async () => {
        await onmessage({ toolCall: { functionCalls: [{ id: "e", name: "end_call", args: {} }] } });
      });
      expect(c.endCall).not.toHaveBeenCalled();

      await act(async () => {
        await onmessage({ serverContent: { modelTurn: { parts: [{ inlineData: { data: "AAAA" } }] } } });
        await onmessage({ serverContent: { turnComplete: true } });
      });
      await waitFor(() => expect(c.endCall).toHaveBeenCalledTimes(1));
    });

    it("sends nothing for a call Gemini cancelled", async () => {
      let finish!: (value: unknown) => void;
      liveMocks.post.mockReturnValue(new Promise(resolve => { finish = resolve; }));
      await connected(controls());

      await act(async () => {
        void onmessage({ toolCall: { functionCalls: [{ id: "c1", name: "rename_story", args: {} }] } });
        await onmessage({ toolCallCancellation: { ids: ["c1"] } });
        finish({ data: { result: "Renamed." } });
      });

      expect(sendToolResponse).not.toHaveBeenCalled();
    });

    it("never sends an old call's late result into the next call", async () => {
      let finish!: (value: unknown) => void;
      liveMocks.post.mockReturnValue(new Promise(resolve => { finish = resolve; }));
      const { result } = await connected(controls());
      const firstCall = sendToolResponse;

      await act(async () => {
        void onmessage({ toolCall: { functionCalls: [{ id: "c2", name: "rename_story", args: {} }] } });
      });
      act(() => result.current.disconnect());
      const secondCall = vi.fn();
      sendToolResponse = secondCall;
      await act(async () => {
        await result.current.connect();
      });
      await act(async () => {
        finish({ data: { result: "Renamed." } });
      });

      expect(firstCall).not.toHaveBeenCalled();
      expect(secondCall).not.toHaveBeenCalled();
    });
  });
});
