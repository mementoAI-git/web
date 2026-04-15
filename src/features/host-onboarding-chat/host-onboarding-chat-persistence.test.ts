import { describe, it, expect, beforeEach } from "vitest";
import { storageKeys } from "@/utility/constant";
import {
  clearHostOnboardingChatState,
  HOST_ONBOARDING_CHAT_PERSIST_VERSION,
  loadHostOnboardingChatState,
  sanitizePersistedMessages,
  saveHostOnboardingChatState,
} from "./host-onboarding-chat-persistence";

const defaultHints = {
  suggestionChips: [] as string[],
  composerPlaceholder: "Your reply",
  composerLabel: "Your reply",
};

describe("host-onboarding-chat-persistence", () => {
  beforeEach(() => {
    localStorage.removeItem(storageKeys.hostOnboardingChat);
  });

  it("round-trips save and load", () => {
    saveHostOnboardingChatState({
      introAcknowledged: true,
      introDraft: "",
      messages: [{ id: "1", role: "assistant", content: "Hi" }],
      isComplete: false,
      draft: "partial",
      composerHints: { ...defaultHints, suggestionChips: ["A"] },
      progressStep: 2,
      progressTotal: 6,
    });
    expect(loadHostOnboardingChatState()).toEqual({
      v: HOST_ONBOARDING_CHAT_PERSIST_VERSION,
      introAcknowledged: true,
      introDraft: "",
      messages: [{ id: "1", role: "assistant", content: "Hi" }],
      isComplete: false,
      draft: "partial",
      composerHints: { ...defaultHints, suggestionChips: ["A"] },
      progressStep: 2,
      progressTotal: 6,
    });
  });

  it("returns null for invalid JSON", () => {
    localStorage.setItem(storageKeys.hostOnboardingChat, "not-json");
    expect(loadHostOnboardingChatState()).toBeNull();
  });

  it("returns null for wrong version (including legacy v4)", () => {
    localStorage.setItem(
      storageKeys.hostOnboardingChat,
      JSON.stringify({
        v: 4,
        introAcknowledged: true,
        introDraft: "",
        messages: [],
        activeExchangeIndex: 0,
        isComplete: false,
        draft: "",
      }),
    );
    expect(loadHostOnboardingChatState()).toBeNull();
  });

  it("returns null when a message is malformed", () => {
    localStorage.setItem(
      storageKeys.hostOnboardingChat,
      JSON.stringify({
        v: HOST_ONBOARDING_CHAT_PERSIST_VERSION,
        introAcknowledged: true,
        introDraft: "",
        messages: [{ id: 1, role: "assistant", content: "x" }],
        isComplete: false,
        draft: "",
        composerHints: defaultHints,
        progressStep: 1,
        progressTotal: null,
      }),
    );
    expect(loadHostOnboardingChatState()).toBeNull();
  });

  it("returns null when composerHints is invalid", () => {
    localStorage.setItem(
      storageKeys.hostOnboardingChat,
      JSON.stringify({
        v: HOST_ONBOARDING_CHAT_PERSIST_VERSION,
        introAcknowledged: true,
        introDraft: "",
        messages: [],
        isComplete: false,
        draft: "",
        composerHints: {},
        progressStep: 1,
        progressTotal: null,
      }),
    );
    expect(loadHostOnboardingChatState()).toBeNull();
  });

  it("load collapses consecutive duplicate assistant messages with same content", () => {
    localStorage.setItem(
      storageKeys.hostOnboardingChat,
      JSON.stringify({
        v: HOST_ONBOARDING_CHAT_PERSIST_VERSION,
        introAcknowledged: true,
        introDraft: "",
        messages: [
          { id: "a", role: "assistant", content: "dup" },
          { id: "b", role: "assistant", content: "dup" },
          { id: "d", role: "user", content: "ok" },
        ],
        isComplete: false,
        draft: "",
        composerHints: defaultHints,
        progressStep: 1,
        progressTotal: 6,
      }),
    );
    const loaded = loadHostOnboardingChatState();
    expect(loaded?.messages).toHaveLength(2);
    expect(loaded?.messages[0].role).toBe("assistant");
    expect(loaded?.messages[1]).toEqual({
      id: "d",
      role: "user",
      content: "ok",
    });
  });

  it("sanitizePersistedMessages keeps alternating assistant/user unchanged", () => {
    const msgs = [
      { id: "1", role: "assistant" as const, content: "A" },
      { id: "2", role: "user" as const, content: "u" },
      { id: "3", role: "assistant" as const, content: "B" },
    ];
    expect(sanitizePersistedMessages(msgs)).toEqual(msgs);
  });

  it("clear removes storage", () => {
    saveHostOnboardingChatState({
      introAcknowledged: true,
      introDraft: "",
      messages: [{ id: "a", role: "user", content: "ok" }],
      isComplete: false,
      draft: "",
      composerHints: defaultHints,
      progressStep: 3,
      progressTotal: 6,
    });
    clearHostOnboardingChatState();
    expect(localStorage.getItem(storageKeys.hostOnboardingChat)).toBeNull();
  });
});
