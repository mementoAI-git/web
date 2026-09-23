export type ChatRole = "assistant" | "user";

/** Legacy scripted composer only (`compose-onboarding-turn` tests). */
export type HostOnboardingExchangeIndex = 0 | 1 | 2 | 3 | 4 | 5;

/** Assistant bubbles from the onboarding stream API. */
export type HostOnboardingAssistantMessageMeta = {
  kind: "onboarding_stream";
};

export interface HostOnboardingMessage {
  id: string;
  role: ChatRole;
  content: string;
  meta?: HostOnboardingAssistantMessageMeta;
}

export interface HostOnboardingChatState {
  messages: HostOnboardingMessage[];
  isTyping: boolean;
  isComplete: boolean;
}

export interface OnboardingComposerHints {
  suggestionChips: string[];
  composerPlaceholder: string;
  composerLabel: string;
}

export interface OnboardingStructuredOutcome {
  extractedInterests: string[];
  suggestedDimensions: string[];
  handoffSummary: string;
}
