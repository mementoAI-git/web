/**
 * Host onboarding chat: timing constants, intro copy, exchange-0 ack helper.
 * Composed assistant turns live in `compose-onboarding-turn.ts`.
 */
import {
  TOTAL_EXCHANGES,
  composeOnboardingTurn,
  composeExchange0Followup,
  DEFAULT_EXCHANGE_0_QUESTION,
  pickChipSubset,
  type ComposedOnboardingTurn,
  type OnboardingComposeContext,
} from "./compose-onboarding-turn";

export {
  TOTAL_EXCHANGES,
  composeOnboardingTurn,
  composeExchange0Followup,
  DEFAULT_EXCHANGE_0_QUESTION,
  pickChipSubset,
  type ComposedOnboardingTurn,
  type OnboardingComposeContext,
};

/** Alias for persistence / legacy tests (canonical default question string). */
export const EXCHANGE_0_FOLLOWUP_QUESTION = DEFAULT_EXCHANGE_0_QUESTION;

/** Milliseconds after the exchange-0 acknowledgment bubble before the follow-up question appears. */
export const EXCHANGE_0_FOLLOWUP_DELAY_MS = 4000;

/** Default pause before every scripted assistant message (after a user turn). */
export const ASSISTANT_PRE_DELAY_MS = EXCHANGE_0_FOLLOWUP_DELAY_MS;

/** @deprecated Legacy single-bubble body; kept for migrating persisted sessions. */
export const LEGACY_EXCHANGE_0_COMBINED_PREFIX =
  "Wonderful. Thanks for saying you're ready.\n\n";

/**
 * Short acknowledgment after the user sends their intro line — terse, peer tone.
 */
export function buildExchange0Acknowledgment(introUserMessage: string): string {
  const t = introUserMessage.trim().replace(/\s+/g, " ");
  if (!t) return "Ok.";

  if (t.includes("?")) {
    return "Fair question.";
  }

  if (
    /^(alright|all right|ok|okay|yeah|yep|yup|sure|ready|let'?s go|let us go)\b/i.test(
      t
    ) &&
    t.length < 80
  ) {
    return "Ok.";
  }

  if (
    /!{2,}/.test(t) ||
    /\b(loving|love it|love this|excited|pumped|stoked|can'?t wait)\b/i.test(t)
  ) {
    return "Nice.";
  }

  if (
    /\b(not sure|nervous|worried|unsure|maybe|on the fence)\b/i.test(t)
  ) {
    return "Fair.";
  }

  if (/\b(thanks|thank you|cheers)\b/i.test(t)) {
    return "Yep.";
  }

  if (t.length > 120) {
    return "Thanks.";
  }

  return "Ok.";
}

/** Centered headline on the pre-chat intro (nickname from /onboarding/nickname). */
export function buildIntroHeadline(nickname: string): string {
  const trimmed = nickname.trim();
  const who = trimmed.length > 0 ? trimmed : "there";
  return `Okay, ${who}. I've got some questions for you.`;
}

export const INTRO_SUBCOPY =
  "These questions will help Memento better personalize your experience on the product.";

/** Default text in the intro composer; user can edit, then send with Enter or the send button. */
export const DEFAULT_INTRO_REPLY = "Alright, I'm ready";

/** @deprecated Use {@link buildExchange0Acknowledgment} + composed exchange-0 follow-up. */
export function buildFirstExchangeAssistantContent(_nickname: string): string {
  return `${buildExchange0Acknowledgment(DEFAULT_INTRO_REPLY)}\n\n${EXCHANGE_0_FOLLOWUP_QUESTION}`;
}
