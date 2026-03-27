import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { storageKeys } from "@/utility/constant";
import { useHostOnboardingChat } from "./use-host-onboarding-chat";

describe("useHostOnboardingChat", () => {
  beforeEach(() => {
    localStorage.removeItem(storageKeys.hostOnboardingChat);
  });

  it("with persist false, bootstraps first assistant from stream API (MSW)", async () => {
    const { result } = renderHook(() =>
      useHostOnboardingChat({
        assistantPreDelayMs: 0,
        persist: false,
        nickname: "Jamie",
      }),
    );

    await waitFor(() => {
      expect(result.current.isTyping).toBe(false);
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe("assistant");
      expect(result.current.messages[0].content).toMatch(/glad you're here/i);
    });
    expect(result.current.script.suggestionChips.length).toBeGreaterThan(0);
    expect(result.current.showProgressDots).toBe(true);
  });

  it("with persist, intro submit then streams assistant from API", async () => {
    const { result } = renderHook(() =>
      useHostOnboardingChat({
        assistantPreDelayMs: 0,
        persist: true,
        nickname: "Riley",
      }),
    );

    expect(result.current.introAcknowledged).toBe(false);

    act(() => {
      result.current.setIntroDraft("I'm ready");
    });
    act(() => {
      result.current.submitIntro();
    });

    await waitFor(() => {
      expect(result.current.introAcknowledged).toBe(true);
      expect(result.current.messages.some((m) => m.role === "user")).toBe(
        true,
      );
      expect(result.current.messages.some((m) => m.role === "assistant")).toBe(
        true,
      );
    });
  });

  it("resetFlow clears progress and shows intro again when persist", async () => {
    const { result } = renderHook(() =>
      useHostOnboardingChat({
        assistantPreDelayMs: 0,
        persist: true,
        nickname: "Pat",
      }),
    );

    act(() => {
      result.current.setIntroDraft("go");
    });
    act(() => {
      result.current.submitIntro();
    });
    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThanOrEqual(1);
    });

    act(() => {
      result.current.resetFlow();
    });

    expect(result.current.introAcknowledged).toBe(false);
    expect(result.current.introDraft).toBe("");
    expect(result.current.messages).toHaveLength(0);
    expect(result.current.isComplete).toBe(false);

    const raw = localStorage.getItem(storageKeys.hostOnboardingChat);
    if (raw) {
      const saved = JSON.parse(raw) as { messages: unknown[] };
      expect(saved.messages).toEqual([]);
    }
  });

  it("advances after user submits a turn", async () => {
    const { result } = renderHook(() =>
      useHostOnboardingChat({
        assistantPreDelayMs: 0,
        persist: false,
        nickname: "Jamie",
      }),
    );

    await waitFor(() => {
      expect(result.current.isTyping).toBe(false);
    });

    act(() => {
      result.current.setDraft("Family stories");
    });
    act(() => {
      result.current.submitUserTurn();
    });

    await waitFor(() => {
      expect(result.current.messages.filter((m) => m.role === "user")).toHaveLength(1);
      expect(result.current.exchangeNumberDisplay).toBeGreaterThanOrEqual(1);
    });
  });

  it("appendChipToDraft builds comma-separated chips", async () => {
    const { result } = renderHook(() =>
      useHostOnboardingChat({
        assistantPreDelayMs: 0,
        persist: false,
        nickname: "Jamie",
      }),
    );

    await waitFor(() => {
      expect(result.current.isTyping).toBe(false);
    });

    act(() => {
      result.current.appendChipToDraft("A");
    });
    act(() => {
      result.current.appendChipToDraft("B");
    });

    expect(result.current.draft).toBe("A, B");
  });

  it("marks complete when API returns flow_complete after enough user turns", async () => {
    const { result } = renderHook(() =>
      useHostOnboardingChat({
        assistantPreDelayMs: 0,
        persist: false,
        nickname: "Jamie",
      }),
    );

    await waitFor(() => {
      expect(result.current.isTyping).toBe(false);
    });

    for (let i = 0; i < 7; i++) {
      await waitFor(() => {
        expect(result.current.isTyping).toBe(false);
        expect(result.current.isComplete).toBe(false);
      });
      act(() => {
        result.current.setDraft(`reply ${i + 1}`);
      });
      act(() => {
        result.current.submitUserTurn();
      });
    }

    await waitFor(() => {
      expect(result.current.isComplete).toBe(true);
    });
  });
});
