import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLiveAPI } from "./index";

const transport = vi.hoisted(() => ({
  autoSetup: true,
  options: null as null | { config: Record<string, unknown>; callbacks: { onmessage: (message: unknown) => void; onclose: (event: { code: number; reason: string }) => void } },
}));
const session = vi.hoisted(() => ({ close: vi.fn(), sendClientContent: vi.fn(), sendRealtimeInput: vi.fn() }));
vi.mock("@google/genai", () => ({
  Modality: { AUDIO: "AUDIO" },
  GoogleGenAI: class {
    live = { connect: async (options: NonNullable<typeof transport.options>) => {
      transport.options = options;
      if (transport.autoSetup) options.callbacks.onmessage({ setupComplete: {} });
      return session;
    } };
  },
}));
vi.mock("@/hooks/use-store", () => ({ useStore: () => ({ user: { chat_voice: "Kore" } }) }));
const saveMessages = vi.hoisted(() => vi.fn());
vi.mock("../use-fetcher", () => ({ default: (url: string) => ({ trigger: url.includes("ephemeral") ? async () => ({ data: { token: "test-token" } }) : saveMessages }) }));
vi.mock("@/utility", () => ({ createSystemContext: () => "Test context", isEmpty: (value: unknown) => !value || Object.keys(value).length === 0 }));

const stop = vi.fn();
const stream = { getTracks: () => [{ stop }], getAudioTracks: () => [{ stop }] } as unknown as MediaStream;
const media = vi.fn();
const contexts: { close: ReturnType<typeof vi.fn> }[] = [];
class AudioContextMock {
  currentTime = 0;
  state = "running";
  destination = {};
  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn(async () => { this.state = "closed"; });
  constructor() { contexts.push(this); }
  createGain() { return { connect: vi.fn(), disconnect: vi.fn() }; }
  createScriptProcessor() { return { connect: vi.fn(), disconnect: vi.fn(), onaudioprocess: null }; }
  createMediaStreamSource() { return { connect: vi.fn(), disconnect: vi.fn() }; }
}

beforeEach(() => {
  vi.clearAllMocks();
  saveMessages.mockImplementation(async ({ messages }) => ({ data: messages.map((message: object, index: number) => ({ ...message, _id: `saved-${index}`, memory: "m1", created_at: "2026-10-06T10:00:00Z" })) }));
  transport.autoSetup = true;
  transport.options = null;
  contexts.length = 0;
  vi.stubGlobal("AudioContext", AudioContextMock);
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: media } });
  media.mockResolvedValue(stream);
});
afterEach(() => vi.unstubAllGlobals());

describe("inline voice lifecycle", () => {
  it("sends typed turns over the same live session and saves their history", async () => {
    const onMessages = vi.fn();
    const { result } = renderHook(() => useLiveAPI({ memoryId: "64b7f0c2a1b2c3d4e5f60718", onMessages }));
    await act(async () => { await result.current.connect(); await result.current.startRecording(); });
    await act(async () => { await result.current.sendChatInput({ text: "Tell me more" }); });
    expect(session.sendRealtimeInput).toHaveBeenCalledWith({ text: "Tell me more" });
    expect(session.close).not.toHaveBeenCalled();
    expect(saveMessages).toHaveBeenCalledWith(expect.objectContaining({ memory_id: "64b7f0c2a1b2c3d4e5f60718", messages: [expect.objectContaining({ text: "Tell me more", role: "user" })] }));
    expect(onMessages).toHaveBeenCalledWith([expect.objectContaining({ _id: "saved-0", text: "Tell me more" })]);
  });

  it.each([null, "new", "[object Object]"])("saves by session instead of sending the memory id %s, which the API rejects", async (memoryId) => {
    const { result } = renderHook(() => useLiveAPI({ memoryId }));
    await act(async () => { await result.current.connect(); await result.current.startRecording(); });
    await act(async () => { await result.current.sendChatInput({ text: "Hello" }); });
    const payload = saveMessages.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("memory_id");
    expect(payload.session_id).toEqual(expect.any(String));
  });

  it("delivers typed input while history saving is unavailable", async () => {
    saveMessages.mockRejectedValue(new Error("Save API unavailable"));
    const onMessages = vi.fn();
    const { result } = renderHook(() => useLiveAPI({ memoryId: "m1", onMessages }));
    await act(async () => { await result.current.connect(); await result.current.startRecording(); });
    await act(async () => { await result.current.sendChatInput({ text: "Please answer me" }); });
    expect(session.sendRealtimeInput).toHaveBeenCalledWith({ text: "Please answer me" });
    expect(onMessages).toHaveBeenCalledWith([expect.objectContaining({ text: "Please answer me" })]);
    expect(result.current.error).toMatch(/not be saved/);
  });

  it("retains both user and AI transcript tails when a turn completes", async () => {
    const onMessages = vi.fn();
    const { result } = renderHook(() => useLiveAPI({ memoryId: "m1", onMessages }));
    await act(async () => { await result.current.connect(); });
    await act(async () => { transport.options!.callbacks.onmessage({ serverContent: { inputTranscription: { text: "My question" }, outputTranscription: { text: "My answer" }, turnComplete: true } }); });
    expect(saveMessages).toHaveBeenCalledOnce();
    expect(saveMessages.mock.calls[0][0].messages.map((message: { text: string }) => message.text)).toEqual(["My question", "My answer"]);
  });

  it("waits for Gemini setup acceptance and uses supported transcription fields", async () => {
    transport.autoSetup = false;
    const { result } = renderHook(() => useLiveAPI({}));
    let connection!: Promise<boolean>;
    await act(async () => { connection = result.current.connect(); });
    expect(result.current.connected).toBe(false);
    expect(transport.options?.config).toMatchObject({ inputAudioTranscription: {}, outputAudioTranscription: {} });
    expect(transport.options?.config.inputAudioTranscription).not.toHaveProperty("languageCode");
    expect(transport.options?.config.outputAudioTranscription).not.toHaveProperty("languageCode");
    await act(async () => {
      transport.options!.callbacks.onmessage({ setupComplete: {} });
      expect(await connection).toBe(true);
    });
    expect(result.current.connected).toBe(true);
  });

  it("returns a retryable error when Gemini rejects setup", async () => {
    transport.autoSetup = false;
    const { result } = renderHook(() => useLiveAPI({}));
    let connection!: Promise<boolean>;
    await act(async () => { connection = result.current.connect(); });
    await act(async () => {
      transport.options!.callbacks.onclose({ code: 1007, reason: "Invalid setup" });
      expect(await connection).toBe(false);
    });
    expect(result.current.error).toMatch(/1007.*Invalid setup/);
    expect(media).not.toHaveBeenCalled();
    transport.autoSetup = true;
    await act(async () => { expect(await result.current.connect()).toBe(true); });
  });

  it("ignores a previous socket closing after a successful retry", async () => {
    const { result } = renderHook(() => useLiveAPI({}));
    await act(async () => { await result.current.connect(); });
    const oldCallbacks = transport.options!.callbacks;
    await act(async () => { result.current.disconnect(); });
    await act(async () => { await result.current.connect(); });
    await act(async () => { oldCallbacks.onclose({ code: 1000, reason: "" }); });
    expect(result.current.connected).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("settles pending startup when the user leaves", async () => {
    transport.autoSetup = false;
    const { result, unmount } = renderHook(() => useLiveAPI({}));
    let connection!: Promise<boolean>;
    await act(async () => { connection = result.current.connect(); });
    unmount();
    expect(await connection).toBe(false);
    expect(session.close).toHaveBeenCalled();
    expect(media).not.toHaveBeenCalled();
  });

  it("stops capture when the provider disconnects during a call", async () => {
    const { result } = renderHook(() => useLiveAPI({}));
    await act(async () => { await result.current.connect(); });
    await act(async () => { await result.current.startRecording(); });
    await act(async () => { transport.options!.callbacks.onclose({ code: 1011, reason: "Service unavailable" }); });
    expect(stop).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(false);
    expect(result.current.error).toMatch(/1011/);
  });

  it("greets after capture starts and releases microphone and audio contexts on unmount", async () => {
    const { result, unmount } = renderHook(() => useLiveAPI({}));
    await act(async () => { await result.current.connect(); });
    await act(async () => { expect(await result.current.startRecording()).toBe(true); });
    await act(async () => { await result.current.greet(); });
    expect(session.sendClientContent).toHaveBeenCalledWith(expect.objectContaining({ turnComplete: true }));
    expect(result.current.isRecording).toBe(true);
    unmount();
    expect(stop).toHaveBeenCalled();
    expect(contexts.every(context => context.close.mock.calls.length === 1)).toBe(true);
  });

  it("does not claim to record when microphone access fails", async () => {
    media.mockRejectedValueOnce(new Error("Permission denied"));
    const { result } = renderHook(() => useLiveAPI({}));
    await act(async () => { await result.current.connect(); });
    await act(async () => { expect(await result.current.startRecording()).toBe(false); });
    expect(result.current.isRecording).toBe(false);
    expect(result.current.error).toMatch(/Permission denied/);
  });

  it("stops a microphone grant that arrives after leaving the page", async () => {
    let grant!: (value: MediaStream) => void;
    media.mockReturnValueOnce(new Promise<MediaStream>(resolve => { grant = resolve; }));
    const { result, unmount } = renderHook(() => useLiveAPI({}));
    await act(async () => { await result.current.connect(); });
    let start!: Promise<boolean>;
    await act(async () => { start = result.current.startRecording(); });
    unmount();
    grant(stream);
    expect(await start).toBe(false);
    expect(stop).toHaveBeenCalled();
  });
});
