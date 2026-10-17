import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSpokenReplies } from "./use-spoken-replies";
import { requestSpokenAudio } from "@/features/speech/spoken-audio";
import { toast } from "sonner";
vi.mock("@/features/speech/spoken-audio", async importOriginal => ({
  ...await importOriginal<typeof import("@/features/speech/spoken-audio")>(), requestSpokenAudio: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
const clips: FakeAudio[] = [];
class FakeAudio {
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  removeAttribute = vi.fn();
  constructor(public src: string) { clips.push(this); }
}
const clip = { audioBase64: "YXVkaW8=", mimeType: "audio/wav" as const, voiceName: "Kore" };
beforeEach(() => {
  vi.clearAllMocks(); clips.length = 0;
  vi.stubGlobal("Audio", FakeAudio);
  vi.stubGlobal("speechSynthesis", { speak: vi.fn() });
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:spoken-audio");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  vi.mocked(requestSpokenAudio).mockResolvedValue(clip);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function speaking() {
  const hook = renderHook(({ id, voice }) => useSpokenReplies(id, voice), { initialProps: { id: "one", voice: false } });
  act(() => hook.result.current.toggle());
  act(() => hook.result.current.speak("A new reply."));
  await waitFor(() => expect(clips).toHaveLength(1));
  return hook;
}
describe("useSpokenReplies", () => {
  it.each([
    [404, "Spoken replies aren’t available on this server yet. Please try again after the server is updated."],
    [429, "Spoken replies are temporarily rate limited. Please try again shortly."],
    [503, "The speech service is temporarily unavailable. Please try again shortly."],
  ])("reports a %s speech request failure without blaming audio permissions", async (httpStatus, message) => {
    vi.mocked(requestSpokenAudio).mockRejectedValue({ httpStatus });
    const { result } = renderHook(() => useSpokenReplies("one"));
    act(() => result.current.toggle());
    act(() => result.current.speak("Reply"));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(message));
    expect(clips).toHaveLength(0);
    expect(requestSpokenAudio).toHaveBeenCalledOnce();
  });
  it("identifies browser autoplay restrictions separately from server failures", async () => {
    vi.stubGlobal("Audio", class extends FakeAudio {
      play = vi.fn().mockRejectedValue(new DOMException("Playback blocked", "NotAllowedError"));
    });
    const { result } = renderHook(() => useSpokenReplies("one"));
    act(() => result.current.toggle());
    act(() => result.current.speak("Reply"));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Your browser blocked audio playback. Allow sound for this site, then turn spoken replies on again."));
  });
  it("requests natural speech only for new replies after being enabled", async () => {
    const { result } = renderHook(() => useSpokenReplies("chat-1"));
    act(() => result.current.speak("Old reply"));
    expect(requestSpokenAudio).not.toHaveBeenCalled();
    act(() => result.current.toggle());
    act(() => result.current.speak("## Hello\n**Welcome** to [Memento](https://mymemento.io)."));
    await waitFor(() => expect(clips[0]?.play).toHaveBeenCalledOnce());
    expect(requestSpokenAudio).toHaveBeenCalledWith("Hello\nWelcome to Memento.", expect.any(AbortSignal));
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });
  it("stops and releases audio when muted, without speaking more replies", async () => {
    const { result } = await speaking();
    act(() => result.current.toggle());
    expect(clips[0].pause).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:spoken-audio");
    act(() => result.current.speak("Another"));
    expect(requestSpokenAudio).toHaveBeenCalledOnce();
    expect(result.current.enabled).toBe(false);
  });
  it("aborts pending synthesis and ignores late results after muting", async () => {
    let resolve!: (value: typeof clip) => void;
    vi.mocked(requestSpokenAudio).mockImplementation(() => new Promise(done => { resolve = done; }));
    const { result } = renderHook(() => useSpokenReplies("one"));
    act(() => result.current.toggle());
    act(() => result.current.speak("Pending"));
    expect(result.current.isLoading).toBe(true);
    const signal = vi.mocked(requestSpokenAudio).mock.calls[0][1];
    act(() => result.current.toggle());
    await act(async () => resolve(clip));
    expect(signal.aborted).toBe(true);
    expect(clips).toHaveLength(0);
    expect(toast.error).not.toHaveBeenCalled();
  });
  it("stops on conversation change, voice mode start, and unmount", async () => {
    const { result, rerender, unmount } = await speaking();
    rerender({ id: "two", voice: false });
    expect(clips[0].pause).toHaveBeenCalledOnce();
    act(() => result.current.speak("Two"));
    await waitFor(() => expect(clips).toHaveLength(2));
    rerender({ id: "two", voice: true });
    expect(clips[1].pause).toHaveBeenCalledOnce();
    act(() => result.current.speak("Voice reply"));
    expect(requestSpokenAudio).toHaveBeenCalledTimes(2);
    rerender({ id: "two", voice: false });
    act(() => result.current.speak("Three"));
    await waitFor(() => expect(clips).toHaveLength(3));
    unmount();
    expect(clips[2].pause).toHaveBeenCalledOnce();
  });
  it("prefetches long replies but plays their clips in order", async () => {
    const { result } = renderHook(() => useSpokenReplies("one"));
    act(() => result.current.toggle());
    act(() => result.current.speak("This is a sentence. ".repeat(100)));
    await waitFor(() => expect(requestSpokenAudio).toHaveBeenCalledTimes(2));
    expect(clips).toHaveLength(1);
    await act(async () => clips[0].onended?.());
    await waitFor(() => expect(clips).toHaveLength(2));
    expect(clips[1].play).toHaveBeenCalledOnce();
  });
  it("ignores an old clip error after a new reply has started", async () => {
    const { result } = await speaking();
    const old = clips[0];
    act(() => result.current.speak("Second"));
    await waitFor(() => expect(clips).toHaveLength(2));
    act(() => old.onerror?.());
    expect(result.current.enabled).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();
  });
  it("turns read-aloud off with one error instead of retrying a failed request", async () => {
    vi.mocked(requestSpokenAudio).mockRejectedValue({ httpStatus: 429 });
    const { result } = renderHook(() => useSpokenReplies("one"));
    act(() => result.current.toggle());
    act(() => result.current.speak("Reply"));
    await waitFor(() => expect(result.current.enabled).toBe(false));
    expect(toast.error).toHaveBeenCalledOnce();
    expect(requestSpokenAudio).toHaveBeenCalledOnce();
  });
  it("handles blocked browser playback without retrying or leaking audio URLs", async () => {
    const { result } = await speaking();
    await act(async () => clips[0].onerror?.());
    await waitFor(() => expect(result.current.enabled).toBe(false));
    expect(result.current.isLoading).toBe(false);
    expect(toast.error).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:spoken-audio");
  });
  it("keeps speech unavailable without audio playback support", () => {
    vi.stubGlobal("Audio", undefined);
    const { result } = renderHook(() => useSpokenReplies("one"));
    act(() => result.current.toggle());
    expect(result.current.enabled).toBe(false);
    expect(result.current.supported).toBe(false);
  });
});
