import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSpokenReplies } from "./use-spoken-replies";

const speak = vi.fn();
const cancel = vi.fn();
class Utterance {
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public text: string) {}
}
beforeEach(() => {
  speak.mockClear();
  cancel.mockClear();
  vi.stubGlobal("speechSynthesis", { speak, cancel });
  vi.stubGlobal("SpeechSynthesisUtterance", Utterance);
});
afterEach(() => vi.unstubAllGlobals());

describe("useSpokenReplies", () => {
  it("starts off and speaks new replies only after being enabled", () => {
    const { result } = renderHook(() => useSpokenReplies("chat-1"));
    act(() => result.current.speak("Old reply"));
    expect(speak).not.toHaveBeenCalled();
    act(() => result.current.toggle());
    expect(speak).not.toHaveBeenCalled();
    act(() => result.current.speak("## Hello\n**Welcome** to [Memento](https://mymemento.io)."));
    expect(speak).toHaveBeenCalledOnce();
    expect(speak.mock.calls[0][0].text).toBe("Hello\nWelcome to Memento.");
  });

  it("turns speech off immediately and prevents subsequent replies", () => {
    const { result } = renderHook(() => useSpokenReplies("chat-1"));
    act(() => result.current.toggle());
    act(() => result.current.speak("Reply"));
    act(() => result.current.toggle());
    expect(cancel).toHaveBeenCalledOnce();
    act(() => result.current.speak("Another reply"));
    expect(speak).toHaveBeenCalledOnce();
    expect(result.current.enabled).toBe(false);
  });

  it("stops on a conversation change, voice session start, and unmount", () => {
    const { result, rerender, unmount } = renderHook(({ id, voice }) => useSpokenReplies(id, voice), { initialProps: { id: "one", voice: false } });
    act(() => result.current.toggle());
    act(() => result.current.speak("One"));
    rerender({ id: "two", voice: false });
    expect(cancel).toHaveBeenCalledTimes(1);
    act(() => result.current.speak("Two"));
    rerender({ id: "two", voice: true });
    expect(cancel).toHaveBeenCalledTimes(2);
    act(() => result.current.speak("Voice reply"));
    expect(speak).toHaveBeenCalledTimes(2);
    rerender({ id: "two", voice: false });
    act(() => result.current.speak("Three"));
    unmount();
    expect(cancel).toHaveBeenCalledTimes(3);
  });

  it("does not let a cancellation event disable the next reply", () => {
    const { result } = renderHook(() => useSpokenReplies("one"));
    act(() => result.current.toggle());
    act(() => result.current.speak("One"));
    const first = speak.mock.calls[0][0] as Utterance;
    act(() => result.current.speak("Two"));
    act(() => first.onerror?.());
    expect(result.current.enabled).toBe(true);
    act(() => (speak.mock.calls[1][0] as Utterance).onerror?.());
    expect(result.current.enabled).toBe(false);
  });

  it("stays disabled in browsers without speech synthesis", () => {
    vi.stubGlobal("speechSynthesis", undefined);
    const { result } = renderHook(() => useSpokenReplies("one"));
    expect(result.current.supported).toBe(false);
    act(() => result.current.toggle());
    act(() => result.current.speak("Reply"));
    expect(result.current.enabled).toBe(false);
    expect(speak).not.toHaveBeenCalled();
  });
});
