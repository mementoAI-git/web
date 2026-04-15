/**
 * Host Onboarding (Groot) — Types and option constants
 * @see memento-onboarding-prd.md
 * Life-area keys for priorities align with Enrichment Score categories (`docs/MEMENTO_ENRICHMENT_SCORE.md`).
 */

import type { EnrichmentCategory, EnrichmentCategoryOption } from "@/features/enrichment/enrichment-categories";
import {
  ENRICHMENT_CATEGORY_OPTIONS,
  ONBOARDING_ENRICHMENT_CATEGORY_OPTIONS,
} from "@/features/enrichment/enrichment-categories";

/** @deprecated Use `EnrichmentCategory` — kept for incremental refactors */
export type DimensionKey = EnrichmentCategory;

export type { EnrichmentCategory };

/** Selectable row in onboarding dimension step (same shape as enrichment options). */
export type DimensionOption = EnrichmentCategoryOption;

// Identity flow (steps 1–4)
export type AgeBand =
  | "under_30"
  | "30s_40s"
  | "50s_60s"
  | "70_plus"
  | "prefer_not_say";

export type MementoFor =
  | "children"
  | "grandchildren"
  | "partner_spouse"
  | "close_friends"
  | "future_generations"
  | "myself"
  | "something_else";

export type PassionKey =
  | "food_cooking"
  | "travel_places"
  | "faith_spirituality"
  | "music"
  | "sports_fitness"
  | "reading_learning"
  | "nature_outdoors"
  | "art_creativity"
  | "family_history_heritage"
  | "business_entrepreneurship"
  | "community_service"
  | "technology"
  | "something_else";

export type LifeContextKey =
  | "still_working"
  | "retired_slowing_down"
  | "recent_loss"
  | "health_change"
  | "major_milestone"
  | "life_stable"
  | "none_of_these";

export type ExpressionMode = "voice" | "writing" | "media" | "guided";

export type HostArchetype =
  | "family"
  | "life_lived"
  | "planning"
  | "young"
  | "other";

export type MotivationType =
  | "emotional_depth"
  | "memory_preservation"
  | "external"
  | "practical"
  | "explorer";

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface OnboardingState {
  currentStep: OnboardingStep;
  // Identity (steps 1–4)
  fullName: string;
  displayName: string; // nickname — used in UI and by AI day-to-day
  ageBand: AgeBand | null;
  whereFrom: string;
  mementoFor: MementoFor[];
  passions: PassionKey[];
  passionsFreetext: string; // for "Something else"
  lifeContext: LifeContextKey[];
  // Intent (steps 5–8)
  motivationType: MotivationType | null;
  priorityDimensions: EnrichmentCategory[];
  expressionMode: ExpressionMode[];
  isComplete: boolean;
  isRevisitMode: boolean;
}

export interface ArchetypeOption {
  value: HostArchetype;
  label: string;
  sublabel: string;
  icon: string;
}

export interface MotivationOption {
  value: MotivationType;
  label: string;
  sublabel: string;
  icon: string;
}

export interface ExpressionOption {
  value: ExpressionMode;
  label: string;
  sublabel: string;
  icon: string;
}

export interface AgeBandOption {
  value: AgeBand;
  label: string;
  icon: string;
}

export interface MementoForOption {
  value: MementoFor;
  label: string;
  icon: string;
}

export interface PassionOption {
  value: PassionKey;
  label: string;
  icon: string;
}

export interface LifeContextOption {
  value: LifeContextKey;
  label: string;
  icon: string;
}

export const AGE_BAND_OPTIONS: AgeBandOption[] = [
  { value: "under_30", label: "Under 30", icon: "🌱" },
  { value: "30s_40s", label: "30s–40s", icon: "🌿" },
  { value: "50s_60s", label: "50s–60s", icon: "🌳" },
  { value: "70_plus", label: "70 and older", icon: "🌲" },
  { value: "prefer_not_say", label: "I'd rather not say", icon: "🙂" },
];

export const MEMENTO_FOR_OPTIONS: MementoForOption[] = [
  { value: "children", label: "My children", icon: "👶" },
  { value: "grandchildren", label: "My grandchildren", icon: "👴" },
  { value: "partner_spouse", label: "A partner or spouse", icon: "💑" },
  { value: "close_friends", label: "Close friends", icon: "🤝" },
  { value: "future_generations", label: "Future generations I'll never meet", icon: "🌍" },
  { value: "myself", label: "Mostly for myself", icon: "✨" },
  { value: "something_else", label: "Add something else", icon: "" },
];

export const PASSION_OPTIONS: PassionOption[] = [
  { value: "food_cooking", label: "Food & cooking", icon: "🍳" },
  { value: "travel_places", label: "Travel & places", icon: "✈️" },
  { value: "faith_spirituality", label: "Faith & spirituality", icon: "🕯️" },
  { value: "music", label: "Music", icon: "🎵" },
  { value: "sports_fitness", label: "Sports & fitness", icon: "🏃" },
  { value: "reading_learning", label: "Reading & learning", icon: "📚" },
  { value: "nature_outdoors", label: "Nature & the outdoors", icon: "🌲" },
  { value: "art_creativity", label: "Art & creativity", icon: "🎨" },
  { value: "family_history_heritage", label: "Family history & heritage", icon: "📜" },
  { value: "business_entrepreneurship", label: "Business & entrepreneurship", icon: "💼" },
  { value: "community_service", label: "Community & service", icon: "🤲" },
  { value: "technology", label: "Technology", icon: "💻" },
  { value: "something_else", label: "Add something else", icon: "" },
];

export const LIFE_CONTEXT_OPTIONS: LifeContextOption[] = [
  { value: "still_working", label: "I'm still working / actively building something", icon: "🔨" },
  { value: "retired_slowing_down", label: "I'm retired or slowing down", icon: "🌅" },
  { value: "recent_loss", label: "I've recently lost someone close to me", icon: "🕊️" },
  { value: "health_change", label: "A health change made me think about this", icon: "💚" },
  { value: "major_milestone", label: "I'm at a major life milestone", icon: "🎯" },
  { value: "life_stable", label: "Life is stable — I'm just being intentional", icon: "☀️" },
  { value: "none_of_these", label: "None of these feel right", icon: "🙂" },
];

export const ARCHETYPE_OPTIONS: ArchetypeOption[] = [
  {
    value: "family",
    label: "I'm preserving memories for my family",
    sublabel: "Stories, photos, and things they should know",
    icon: "🌿",
  },
  {
    value: "life_lived",
    label: "I'm reflecting on a life well-lived",
    sublabel: "A rich journey worth remembering",
    icon: "📖",
  },
  {
    value: "planning",
    label: "I'm planning thoughtfully for the future",
    sublabel: "Organised, intentional, ahead of time",
    icon: "🕊️",
  },
  {
    value: "young",
    label: "I'm young and thinking ahead",
    sublabel: "Because now is as good a time as any",
    icon: "✨",
  },
  {
    value: "other",
    label: "Something else",
    sublabel: "I'll describe it in my own words (optional)",
    icon: "💬",
  },
];

export const MOTIVATION_OPTIONS: MotivationOption[] = [
  {
    value: "emotional_depth",
    label: "I want the people I love to truly know me",
    sublabel: "The full picture, not just the highlights",
    icon: "💛",
  },
  {
    value: "memory_preservation",
    label: "I have memories I'm afraid of losing",
    sublabel: "Before they fade or disappear",
    icon: "🫙",
  },
  {
    value: "external",
    label: "Someone I love asked me to do this",
    sublabel: "I'm here because they asked",
    icon: "🤍",
  },
  {
    value: "practical",
    label: "I'm being practical about the future",
    sublabel: "Getting important things in order",
    icon: "🗂️",
  },
  {
    value: "explorer",
    label: "I just want to see what this is",
    sublabel: "Exploring for now",
    icon: "🔍",
  },
];

/** All enrichment categories (e.g. settings copy, migrations). */
export const DIMENSION_OPTIONS: EnrichmentCategoryOption[] = ENRICHMENT_CATEGORY_OPTIONS;

/** Initial onboarding: excludes deferred categories (`lessons_wisdom`, `hopes_legacy`). */
export const ONBOARDING_DIMENSION_OPTIONS: EnrichmentCategoryOption[] =
  ONBOARDING_ENRICHMENT_CATEGORY_OPTIONS;

export const EXPRESSION_OPTIONS: ExpressionOption[] = [
  {
    value: "voice",
    label: "Talking — I prefer to speak",
    sublabel: "Recording a voice note feels natural to me",
    icon: "🎙️",
  },
  {
    value: "writing",
    label: "Writing — I like taking my time",
    sublabel: "I'd rather compose my thoughts in words",
    icon: "✍️",
  },
  {
    value: "media",
    label: "Photos & videos",
    sublabel: "Showing is easier than telling",
    icon: "📷",
  },
  {
    value: "guided",
    label: "Guided questions",
    sublabel: "I need a prompt to get me started",
    icon: "💬",
  },
];

export const STEP_LABELS: Record<OnboardingStep, string> = {
  1: "Let's get started",
  2: "A little about you",
  3: "What you love",
  4: "Your life right now",
  5: "Getting to know you",
  6: "Almost halfway",
  7: "Nearly there",
  8: "You're all set",
};

export const ADVANCE_LABELS: Record<OnboardingStep, string> = {
  1: "Continue →",
  2: "Continue →",
  3: "Continue →",
  4: "Continue →",
  5: "Continue →",
  6: "Continue →",
  7: "Almost there →",
  8: "Let's begin →",
};
