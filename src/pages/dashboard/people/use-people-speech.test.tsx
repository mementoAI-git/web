import { act, renderHook } from "@testing-library/react";
import { vi, afterEach, it, expect } from "vitest";
import { usePeopleSpeech } from "./use-people-speech";
const instances: FakeRecognition[] = [];
class FakeRecognition {
  lang = "";
  continuous = false;
  interimResults = false;
  onresult:
    | ((event: {
        results: { isFinal: boolean; 0: { transcript: string } }[];
      }) => void)
    | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  constructor() {
    instances.push(this);
  }
}
afterEach(() => {
  vi.unstubAllGlobals();
  instances.length = 0;
});
it("starts only after an explicit action and stops the microphone on deactivation", () => {
  vi.stubGlobal("SpeechRecognition", FakeRecognition);
  const onDictation = vi.fn();
  const { result, rerender, unmount } = renderHook(
    ({ enabled }) =>
      usePeopleSpeech({ enabled, onDictation, onVoiceMessage: vi.fn() }),
    { initialProps: { enabled: true } },
  );
  expect(instances).toHaveLength(0);
  act(() => result.current.dictate());
  expect(instances[0].start).toHaveBeenCalledOnce();
  act(() =>
    instances[0].onresult?.({
      results: [{ isFinal: true, 0: { transcript: "Our walk" } }],
    }),
  );
  expect(onDictation).toHaveBeenCalledWith("Our walk");
  rerender({ enabled: false });
  expect(instances[0].abort).toHaveBeenCalled();
  act(() => result.current.dictate());
  expect(instances).toHaveLength(1);
  unmount();
});
it("aborts recognition and playback on unmount without restarting recognition", () => {
  vi.stubGlobal("SpeechRecognition", FakeRecognition);
  const cancel = vi.fn();
  vi.stubGlobal("speechSynthesis", { cancel });
  const { result, unmount } = renderHook(() =>
    usePeopleSpeech({
      enabled: true,
      onDictation: vi.fn(),
      onVoiceMessage: vi.fn(),
    }),
  );
  act(() => result.current.dictate());
  unmount();
  expect(instances[0].abort).toHaveBeenCalled();
  expect(instances[0].onend).toBeNull();
  expect(cancel).toHaveBeenCalled();
});
