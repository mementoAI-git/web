import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  messagesForOnboardingApi,
  streamHostOnboardingChat,
  type OnboardingStreamMeta,
} from "@/api/host-onboarding-chat";
import {
  clearHostOnboardingChatState,
  loadHostOnboardingChatState,
  saveHostOnboardingChatState,
} from "./host-onboarding-chat-persistence";
import type { HostOnboardingMessage, OnboardingComposerHints } from "./types";

function nextId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_COMPOSER_HINTS: OnboardingComposerHints = {
  suggestionChips: [],
  composerPlaceholder: "Your reply",
  composerLabel: "Your reply",
};

/** Composer props for the chat screen (intentId reserved for analytics). */
export interface HostOnboardingComposerScript extends OnboardingComposerHints {
  intentId: string;
}

export interface UseHostOnboardingChatOptions {
  /**
   * Pause before opening the stream request (ms). Default 0; raise for pacing
   * similar to the old scripted delay.
   */
  assistantPreDelayMs?: number;
  /** When false, skip reading/writing localStorage (e.g. tests). */
  persist?: boolean;
  /** Display name from profile (after /onboarding/nickname). Sent on every stream call. */
  nickname?: string;
}

const DEFAULT_PRE_DELAY_MS = 0;

function readInitial(persist: boolean) {
  if (!persist) {
    return {
      messages: [] as HostOnboardingMessage[],
      isComplete: false,
      draft: "",
      introAcknowledged: true,
      introDraft: "",
      isTyping: true,
      restored: false,
      composerHints: { ...DEFAULT_COMPOSER_HINTS },
      progressStep: 1,
      progressTotal: null as number | null,
    };
  }
  const p = loadHostOnboardingChatState();
  const restored = !!(p && (p.messages.length > 0 || p.isComplete));
  return {
    messages: p?.messages ?? [],
    isComplete: p?.isComplete ?? false,
    draft: p?.draft ?? "",
    introAcknowledged: p?.introAcknowledged ?? false,
    introDraft: p?.introDraft ?? "",
    isTyping: false,
    restored,
    composerHints: p?.composerHints ?? { ...DEFAULT_COMPOSER_HINTS },
    progressStep: p?.progressStep ?? 1,
    progressTotal: p?.progressTotal ?? null,
  };
}

export function useHostOnboardingChat(
  options: UseHostOnboardingChatOptions = {},
) {
  const assistantPreDelayMs =
    options.assistantPreDelayMs ?? DEFAULT_PRE_DELAY_MS;
  const persist = options.persist !== false;
  const nickname = options.nickname ?? "";
  const nicknameRef = useRef(nickname);
  nicknameRef.current = nickname;

  const initial = readInitial(persist);

  const [messages, setMessages] = useState<HostOnboardingMessage[]>(
    initial.messages,
  );
  const [isTyping, setIsTyping] = useState(initial.isTyping);
  const [isComplete, setIsComplete] = useState(initial.isComplete);
  const [draft, setDraft] = useState(initial.draft);
  const [introAcknowledged, setIntroAcknowledged] = useState(
    initial.introAcknowledged,
  );
  const [introDraft, setIntroDraft] = useState(initial.introDraft);
  const [streamingAssistantText, setStreamingAssistantText] = useState("");
  const [composerHints, setComposerHints] = useState<OnboardingComposerHints>(
    initial.composerHints,
  );
  const [progressStep, setProgressStep] = useState(initial.progressStep);
  const [progressTotal, setProgressTotal] = useState<number | null>(
    initial.progressTotal,
  );
  const [turnError, setTurnError] = useState<string | null>(null);

  const messagesRef = useRef(initial.messages);
  messagesRef.current = messages;

  const turnAbortRef = useRef<AbortController | null>(null);
  const bootstrapStartedRef = useRef(false);
  const restoredRef = useRef(initial.restored);

  const newTurnSignal = useCallback(() => {
    turnAbortRef.current?.abort();
    const ac = new AbortController();
    turnAbortRef.current = ac;
    return ac.signal;
  }, []);

  useEffect(() => {
    return () => turnAbortRef.current?.abort();
  }, []);

  const applyMeta = useCallback((meta: OnboardingStreamMeta | null) => {
    if (!meta) return;
    if (meta.flow_complete) setIsComplete(true);
    setComposerHints((h) => ({
      suggestionChips: Array.isArray(meta.suggestion_chips)
        ? meta.suggestion_chips
        : h.suggestionChips,
      composerPlaceholder:
        typeof meta.composer_placeholder === "string"
          ? meta.composer_placeholder
          : h.composerPlaceholder,
      composerLabel:
        typeof meta.composer_label === "string"
          ? meta.composer_label
          : h.composerLabel,
    }));
    if (typeof meta.step_index === "number" && meta.step_index >= 1) {
      setProgressStep(meta.step_index);
    }
    if (meta.total_steps === null || typeof meta.total_steps === "number") {
      setProgressTotal(meta.total_steps ?? null);
    }
  }, []);

  const runStream = useCallback(
    async (opts: {
      messagesSnapshot: HostOnboardingMessage[];
      bootstrap?: boolean;
    }) => {
      const signal = newTurnSignal();
      setTurnError(null);
      setIsTyping(true);
      setStreamingAssistantText("");
      try {
        if (assistantPreDelayMs > 0) {
          await new Promise<void>((resolve, reject) => {
            const t = setTimeout(resolve, assistantPreDelayMs);
            const onAbort = () => {
              clearTimeout(t);
              reject(new DOMException("Aborted", "AbortError"));
            };
            signal.addEventListener("abort", onAbort, { once: true });
          });
        }
      } catch {
        setIsTyping(false);
        setStreamingAssistantText("");
        return;
      }

      try {
        const { text, meta } = await streamHostOnboardingChat({
          messages: messagesForOnboardingApi(opts.messagesSnapshot),
          nickname: nicknameRef.current,
          bootstrap: opts.bootstrap,
          signal,
          onVisibleUpdate: (visible) => {
            if (!signal.aborted) setStreamingAssistantText(visible);
          },
        });
        if (signal.aborted) return;

        setStreamingAssistantText("");
        if (text.trim()) {
          setMessages((prev) => [
            ...prev,
            {
              id: nextId(),
              role: "assistant",
              content: text,
              meta: { kind: "onboarding_stream" },
            },
          ]);
        }
        applyMeta(meta);
      } catch (e) {
        if ((e as Error).name === "AbortError" || signal.aborted) return;
        setTurnError(
          e instanceof Error ? e.message : "Assistant reply failed",
        );
      } finally {
        if (!signal.aborted) {
          setIsTyping(false);
          setStreamingAssistantText("");
        }
      }
    },
    [applyMeta, assistantPreDelayMs, newTurnSignal],
  );

  useEffect(() => {
    if (persist) return;
    if (restoredRef.current) return;
    if (!introAcknowledged) return;
    if (bootstrapStartedRef.current) return;
    if (messagesRef.current.length > 0) return;
    bootstrapStartedRef.current = true;
    void runStream({ messagesSnapshot: [], bootstrap: true });
  }, [persist, introAcknowledged, runStream]);

  useEffect(() => {
    if (!persist || isTyping) return;
    saveHostOnboardingChatState({
      introAcknowledged,
      introDraft,
      messages,
      isComplete,
      draft,
      composerHints,
      progressStep,
      progressTotal,
    });
  }, [
    persist,
    isTyping,
    introAcknowledged,
    introDraft,
    messages,
    isComplete,
    draft,
    composerHints,
    progressStep,
    progressTotal,
  ]);

  const submitIntro = useCallback(
    (overrideText?: string) => {
      if (introAcknowledged || isTyping || isComplete) return;
      const text = (overrideText ?? introDraft).trim();
      if (!text) return;

      const userMsg: HostOnboardingMessage = {
        id: nextId(),
        role: "user",
        content: text,
      };
      const snapshot = [...messagesRef.current, userMsg];
      setMessages(snapshot);
      setIntroDraft("");
      setIntroAcknowledged(true);
      void runStream({ messagesSnapshot: snapshot });
    },
    [introAcknowledged, isTyping, isComplete, introDraft, persist, runStream],
  );

  const submitUserTurn = useCallback(() => {
    const text = draft.trim();
    if (!text || isTyping || isComplete) return;

    const userMsg: HostOnboardingMessage = {
      id: nextId(),
      role: "user",
      content: text,
    };
    const snapshot = [...messagesRef.current, userMsg];
    setMessages(snapshot);
    setDraft("");
    void runStream({ messagesSnapshot: snapshot });
  }, [draft, isTyping, isComplete, runStream]);

  const appendChipToDraft = useCallback((chip: string) => {
    setDraft((d) => {
      const t = d.trim();
      if (!t) return chip;
      if (t.includes(chip)) return t;
      return `${t}, ${chip}`;
    });
  }, []);

  const script: HostOnboardingComposerScript = useMemo(
    () => ({
      suggestionChips: composerHints.suggestionChips,
      composerPlaceholder: composerHints.composerPlaceholder,
      composerLabel: composerHints.composerLabel,
      intentId: "",
    }),
    [composerHints],
  );

  const resetFlow = useCallback(() => {
    clearHostOnboardingChatState();
    turnAbortRef.current?.abort();
    turnAbortRef.current = null;
    bootstrapStartedRef.current = false;
    restoredRef.current = false;
    setStreamingAssistantText("");
    setComposerHints({ ...DEFAULT_COMPOSER_HINTS });
    setProgressStep(1);
    setProgressTotal(null);
    setTurnError(null);
    setMessages([]);
    setIsComplete(false);
    setDraft("");
    setIntroAcknowledged(!persist);
    setIntroDraft("");
    setIsTyping(!persist);
  }, [persist]);

  return {
    messages,
    streamingAssistantText,
    isTyping,
    isComplete,
    draft,
    setDraft,
    introAcknowledged,
    introDraft,
    setIntroDraft,
    submitIntro,
    script,
    submitUserTurn,
    appendChipToDraft,
    resetFlow,
    awaitingExchange0FollowUp: false,
    exchangeNumberDisplay: progressStep,
    totalExchanges: progressTotal ?? progressStep,
    progressTotal,
    turnError,
    showProgressDots: progressTotal != null,
  };
}

export { clearHostOnboardingChatState } from "./host-onboarding-chat-persistence";

export function useHostOnboardingChatFieldIds() {
  const composerId = useId();
  const introComposerId = useId();
  return { composerId, introComposerId };
}
