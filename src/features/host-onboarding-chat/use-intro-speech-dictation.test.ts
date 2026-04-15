import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useIntroSpeechDictation } from "./use-intro-speech-dictation";

describe("useIntroSpeechDictation", () => {
  afterEach(() => {
    delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
    delete (window as unknown as { webkitSpeechRecognition?: unknown })
      .webkitSpeechRecognition;
  });

  it("reports not supported when API is missing", () => {
    const { result } = renderHook(() =>
      useIntroSpeechDictation(vi.fn(), true)
    );
    expect(result.current.isSupported).toBe(false);
  });

  it("starts recognition and forwards final transcript", async () => {
    const onFinal = vi.fn();

    class FakeRecognition {
      continuous = false;
      interimResults = false;
      lang = "";
      onresult: ((e: SpeechRecognitionEvent) => void) | null = null;
      onerror: ((e: Event) => void) | null = null;
      onend: (() => void) | null = null;
      start = vi.fn(() => {
        queueMicrotask(() => {
          const results = {
            length: 1,
            0: {
              isFinal: true,
              0: { transcript: "hello world" },
            },
          } as unknown as SpeechRecognitionResultList;
          const event = {
            resultIndex: 0,
            results,
          } as SpeechRecognitionEvent;
          this.onresult?.(event);
        });
      });
      stop = vi.fn(() => {
        this.onend?.();
      });
    }

    (
      window as unknown as {
        webkitSpeechRecognition: new () => FakeRecognition;
      }
    ).webkitSpeechRecognition = FakeRecognition as unknown as new () => FakeRecognition;

    const { result } = renderHook(() => useIntroSpeechDictation(onFinal, true));

    expect(result.current.isSupported).toBe(true);

    act(() => {
      result.current.startListening();
    });

    await waitFor(() => {
      expect(onFinal).toHaveBeenCalledWith("hello world");
    });
    act(() => {
      result.current.stopListening();
    });
    expect(result.current.isListening).toBe(false);
  });

  it("stops when active becomes false", () => {
    const stop = vi.fn();
    class FakeRecognition {
      continuous = false;
      interimResults = false;
      lang = "";
      onresult: ((e: SpeechRecognitionEvent) => void) | null = null;
      onerror: ((e: Event) => void) | null = null;
      onend: (() => void) | null = null;
      start = vi.fn();
      stop = stop;
    }

    (
      window as unknown as {
        webkitSpeechRecognition: new () => FakeRecognition;
      }
    ).webkitSpeechRecognition = FakeRecognition as unknown as new () => FakeRecognition;

    const { result, rerender } = renderHook(
      ({ active }: { active: boolean }) =>
        useIntroSpeechDictation(vi.fn(), active),
      { initialProps: { active: true } }
    );

    act(() => {
      result.current.startListening();
    });

    rerender({ active: false });

    expect(stop).toHaveBeenCalled();
  });
});
