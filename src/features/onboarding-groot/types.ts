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
  | "family_relationships"
  | "ideas_how_things_work"
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
  | "self_understanding"
  | "personal_space"
  | "memory_preservation"
  | "emotional_depth"
  | "explorer"
  /** @deprecated Legacy persisted profiles */
  | "external"
  /** @deprecated Legacy persisted profiles */
  | "practical";

/** Misc onboarding Q1 — includes Something else (stored as `something_else` + freetext). */
export type MiscMotivationChip = MotivationType | "something_else";

export type LifeSituationKey =
  | "run_business"
  | "work_organization"
  | "retired"
  | "caregiver"
  | "student"
  | "between_things"
  | "something_else";

export type PersonalityTraitKey =
  | "warm_caring"
  | "thoughtful_quiet"
  | "funny_lighthearted"
  | "driven_focused"
  | "creative_expressive"
  | "spiritual_reflective"
  | "curious_everything"
  | "strong_dependable"
  | "something_else";

export type MemoryTreasureKey =
  | "quiet_mornings"
  | "family_gatherings"
  | "big_adventures"
  | "turning_points"
  | "everyday_small_things"
  | "people_shaped_me"
  | "funny_stories"
  | "learned_hard_way";

export type HomePlaceSuggestionKey =
  | "city_grew_up"
  | "where_live_now"
  | "where_people_from"
  | "somewhere_changed_me"
  | "rooted_many_places"
  | "prefer_own_words";

export type ChronotypeKey = "morning" | "night";

export type SharingIntentKey = "private_vault" | "shared_legacy";

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
  { value: "family_relationships", label: "Family & relationships", icon: "👨‍👩‍👧" },
  { value: "ideas_how_things_work", label: "Ideas & how things work", icon: "💡" },
  { value: "business_entrepreneurship", label: "Business & entrepreneurship", icon: "💼" },
  { value: "community_service", label: "Community & service", icon: "🤲" },
  { value: "technology", label: "Technology", icon: "💻" },
  { value: "something_else", label: "Add something else", icon: "" },
];

/** `/onboard/misc` Q7 — curated passions (subset of `PassionKey`). */
export const MISC_PASSION_OPTIONS: PassionOption[] = [
  { value: "faith_spirituality", label: "Faith & spirituality", icon: "🕯️" },
  { value: "family_relationships", label: "Family & relationships", icon: "👨‍👩‍👧" },
  { value: "food_cooking", label: "Food & cooking", icon: "🍳" },
  { value: "music", label: "Music", icon: "🎵" },
  { value: "travel_places", label: "Travel & places", icon: "✈️" },
  { value: "ideas_how_things_work", label: "Ideas & how things work", icon: "💡" },
  { value: "nature_outdoors", label: "Nature & the outdoors", icon: "🌲" },
  { value: "art_creativity", label: "Art & creativity", icon: "🎨" },
  { value: "reading_learning", label: "Reading & learning", icon: "📚" },
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
    value: "self_understanding",
    label: "I want to know myself better",
    sublabel: "A clearer sense of who I am over time",
    icon: "🪞",
  },
  {
    value: "personal_space",
    label: "I want a space that holds my life as I live it",
    sublabel: "Media, stories, and context in one place",
    icon: "🏡",
  },
  {
    value: "memory_preservation",
    label: "I have memories I'm afraid of losing",
    sublabel: "Before they fade or disappear",
    icon: "🫙",
  },
  {
    value: "emotional_depth",
    label: "I want the people I love to truly know me",
    sublabel: "The full picture, not just the highlights",
    icon: "💛",
  },
  {
    value: "explorer",
    label: "I just want to see what this is",
    sublabel: "Exploring for now",
    icon: "🔍",
  },
];

export interface MiscMotivationOption {
  value: MiscMotivationChip;
  label: string;
  sublabel: string;
  icon: string;
}

/** `/onboard/misc` Q1 — includes Something else (freetext). */
export const MISC_MOTIVATION_OPTIONS: MiscMotivationOption[] = [
  ...MOTIVATION_OPTIONS.map((o) => ({
    value: o.value as MiscMotivationChip,
    label: o.label,
    sublabel: o.sublabel,
    icon: o.icon,
  })),
  {
    value: "something_else",
    label: "Something else",
    sublabel: "In your own words",
    icon: "➕",
  },
];

export interface LifeSituationOption {
  value: LifeSituationKey;
  label: string;
  icon: string;
}

export const LIFE_SITUATION_OPTIONS: LifeSituationOption[] = [
  { value: "run_business", label: "I run my own business", icon: "💼" },
  { value: "work_organization", label: "I work for an organization", icon: "🏢" },
  { value: "retired", label: "I'm retired", icon: "🌅" },
  { value: "caregiver", label: "I'm a caregiver", icon: "🤲" },
  { value: "student", label: "I'm a student", icon: "🎓" },
  { value: "between_things", label: "Between things right now", icon: "🌀" },
  { value: "something_else", label: "Something else", icon: "➕" },
];

export interface PersonalityTraitOption {
  value: PersonalityTraitKey;
  label: string;
  icon: string;
}

export const PERSONALITY_TRAIT_OPTIONS: PersonalityTraitOption[] = [
  { value: "warm_caring", label: "Warm and caring", icon: "💛" },
  { value: "thoughtful_quiet", label: "Thoughtful and quiet", icon: "🌙" },
  { value: "funny_lighthearted", label: "Funny and lighthearted", icon: "😄" },
  { value: "driven_focused", label: "Driven and focused", icon: "🎯" },
  { value: "creative_expressive", label: "Creative and expressive", icon: "🎨" },
  { value: "spiritual_reflective", label: "Spiritual and reflective", icon: "🕯️" },
  { value: "curious_everything", label: "Curious about everything", icon: "🔍" },
  { value: "strong_dependable", label: "Strong and dependable", icon: "🛡️" },
  { value: "something_else", label: "Something else", icon: "➕" },
];

export interface MemoryTreasureOption {
  value: MemoryTreasureKey;
  label: string;
  icon: string;
}

export const MEMORY_TREASURE_OPTIONS: MemoryTreasureOption[] = [
  { value: "quiet_mornings", label: "Quiet mornings", icon: "🌅" },
  { value: "family_gatherings", label: "Family gatherings", icon: "🍽️" },
  { value: "big_adventures", label: "Big adventures", icon: "✈️" },
  { value: "turning_points", label: "Turning points", icon: "🔀" },
  { value: "everyday_small_things", label: "The everyday small things", icon: "☕" },
  { value: "people_shaped_me", label: "People who shaped me", icon: "💞" },
  { value: "funny_stories", label: "Funny stories", icon: "😂" },
  { value: "learned_hard_way", label: "Things I learned the hard way", icon: "🎓" },
];

export interface HomePlaceSuggestionOption {
  value: HomePlaceSuggestionKey;
  label: string;
  icon: string;
}

export const HOME_PLACE_SUGGESTION_OPTIONS: HomePlaceSuggestionOption[] = [
  { value: "city_grew_up", label: "A city I grew up in", icon: "🏙️" },
  { value: "where_live_now", label: "Where I live now", icon: "🏠" },
  { value: "where_people_from", label: "Where my people are from", icon: "🌍" },
  { value: "somewhere_changed_me", label: "Somewhere that changed me", icon: "✨" },
  { value: "rooted_many_places", label: "I'm rooted in more than one place", icon: "🌐" },
  { value: "prefer_own_words", label: "Prefer to describe in my own words", icon: "✍️" },
];

export interface ChronotypeOption {
  value: ChronotypeKey;
  label: string;
  icon: string;
}

export const CHRONOTYPE_OPTIONS: ChronotypeOption[] = [
  { value: "morning", label: "Morning person", icon: "☀️" },
  { value: "night", label: "Night owl", icon: "🦉" },
];

export interface SharingIntentOption {
  value: SharingIntentKey;
  label: string;
  icon: string;
}

export const SHARING_INTENT_OPTIONS: SharingIntentOption[] = [
  {
    value: "private_vault",
    label: "I want to keep this for myself for now",
    icon: "🔒",
  },
  {
    value: "shared_legacy",
    label: "I eventually want to share this with loved ones",
    icon: "💞",
  },
];

/** `/onboard/misc` Q10 — maps to `EnrichmentCategory` (non-deferred only). */
export interface OnboardingFocusFirstOption {
  value: EnrichmentCategory;
  label: string;
  icon: string;
}

export const ONBOARDING_FOCUS_FIRST_OPTIONS: OnboardingFocusFirstOption[] = [
  { value: "relationships_people", label: "My relationships", icon: "🤝" },
  { value: "work_purpose", label: "My career & work", icon: "🔨" },
  { value: "beliefs_worldview", label: "My beliefs & values", icon: "🕯️" },
  { value: "memories_experiences", label: "My memories & stories", icon: "📚" },
  { value: "heritage_roots", label: "My heritage & where I'm from", icon: "🗺️" },
  { value: "identity_self", label: "Who I am", icon: "🪞" },
  { value: "passions_interests", label: "What I love", icon: "🌟" },
  { value: "everyday_life", label: "Everyday life", icon: "☕" },
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
