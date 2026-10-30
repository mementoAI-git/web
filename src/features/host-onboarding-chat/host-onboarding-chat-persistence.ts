import { storageKeys } from "@/utility/constant";
import type {
  HostOnboardingMessage,
  OnboardingComposerHints,
  OnboardingStructuredOutcome,
} from "./types";

export const HOST_ONBOARDING_CHAT_PERSIST_VERSION = 6 as const;

export interface PersistedHostOnboardingChat {
  v: typeof HOST_ONBOARDING_CHAT_PERSIST_VERSION;
  introAcknowledged: boolean;
  introDraft: string;
  messages: HostOnboardingMessage[];
  isComplete: boolean;
  draft: string;
  composerHints: OnboardingComposerHints;
  /** 1-based step for UI; from API `step_index` when provided. */
  progressStep: number;
  /** From API `total_steps`; null = indeterminate progress UI. */
  progressTotal: number | null;
  structuredOutcome: OnboardingStructuredOutcome;
}

/**
 * Removes consecutive assistant messages with identical content (bad restores / double-fetch).
 */
export function sanitizePersistedMessages(
  messages: HostOnboardingMessage[],
): HostOnboardingMessage[] {
  if (messages.length < 2) return messages;
  const out: HostOnboardingMessage[] = [];
  for (const m of messages) {
    const prev = out[out.length - 1];
    if (
      prev &&
      prev.role === "assistant" &&
      m.role === "assistant" &&
      prev.content === m.content
    ) {
      continue;
    }
    out.push(m);
  }
  return out;
}

function isValidMessage(m: unknown): m is HostOnboardingMessage {
  if (!m || typeof m !== "object") return false;
  const o = m as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    (o.role === "assistant" || o.role === "user") &&
    typeof o.content === "string"
  );
}

export function loadHostOnboardingChatState(userId?: string): PersistedHostOnboardingChat | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(userId ? `${storageKeys.hostOnboardingChat}:${userId}` : storageKeys.hostOnboardingChat);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<PersistedHostOnboardingChat> & {
      v?: number;
    };
    if (p.v !== HOST_ONBOARDING_CHAT_PERSIST_VERSION) return null;
    if (!Array.isArray(p.messages)) return null;
    if (typeof p.isComplete !== "boolean") return null;
    if (typeof p.draft !== "string") return null;
    if (typeof p.introAcknowledged !== "boolean") return null;
    if (typeof p.progressStep !== "number" || p.progressStep < 1) return null;
    if (!(p.progressTotal === null || typeof p.progressTotal === "number"))
      return null;
    const hints = p.composerHints as OnboardingComposerHints | undefined;
    if (
      !hints ||
      !Array.isArray(hints.suggestionChips) ||
      typeof hints.composerPlaceholder !== "string" ||
      typeof hints.composerLabel !== "string"
    ) {
      return null;
    }
    const structuredOutcome = p.structuredOutcome as
      | OnboardingStructuredOutcome
      | undefined;
    if (
      !structuredOutcome ||
      !Array.isArray(structuredOutcome.extractedInterests) ||
      !Array.isArray(structuredOutcome.suggestedDimensions) ||
      typeof structuredOutcome.handoffSummary !== "string"
    ) {
      return null;
    }
    for (const m of p.messages) {
      if (!isValidMessage(m)) return null;
    }

    const introDraft = typeof p.introDraft === "string" ? p.introDraft : "";
    const messages = sanitizePersistedMessages(p.messages);
    return {
      v: HOST_ONBOARDING_CHAT_PERSIST_VERSION,
      introAcknowledged: p.introAcknowledged,
      introDraft,
      messages,
      isComplete: p.isComplete,
      draft: p.draft,
      composerHints: hints,
      progressStep: p.progressStep,
      progressTotal: p.progressTotal,
      structuredOutcome,
    };
  } catch {
    return null;
  }
}

export function saveHostOnboardingChatState(
  data: Omit<PersistedHostOnboardingChat, "v">,
  userId?: string,
): void {
  try {
    const payload: PersistedHostOnboardingChat = {
      v: HOST_ONBOARDING_CHAT_PERSIST_VERSION,
      ...data,
    };
    localStorage.setItem(userId ? `${storageKeys.hostOnboardingChat}:${userId}` : storageKeys.hostOnboardingChat, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function clearHostOnboardingChatState(userId?: string): void {
  try {
    localStorage.removeItem(userId ? `${storageKeys.hostOnboardingChat}:${userId}` : storageKeys.hostOnboardingChat);
  } catch {
    /* ignore */
  }
}
