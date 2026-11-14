import endpoint from "./endpoint";
import { post, get } from "./mutations";
import type {
  OnboardingState,
  AgeBand,
  MementoFor,
  PassionKey,
  ExpressionMode,
  MiscMotivationChip,
  LifeSituationKey,
  PersonalityTraitKey,
  MemoryTreasureKey,
  ChronotypeKey,
  SharingIntentKey,
} from "@/features/onboarding-groot/types";
import { migrateLegacyPriorityList } from "@/features/enrichment/enrichment-categories";
import type { OnboardQuestionsState } from "@/pages/onboarding/misc/useOnboardQuestionsState";

// --- API types (users module) ---

export type OnboardingStatus = "never" | "skipped" | "completed";

export interface OnboardingDetailsUser {
  first_name: string;
  last_name: string;
  nickname: string;
  full_name: string;
  age_range: string;
  location: string;
  age_bracket?: string;
  priority_dimensions?: string[];
  expression_mode?: string;
  chronotype?: string;
  sharing_intent?: string;
  onboarding_step_reached?: number;
  skipped_deep_personalization?: boolean;
}

export interface OnboardingDetailsPersona {
  join_reasons: string[];
  /** The introduction saved at completion, or when onboarding was skipped. */
  self_description?: string;
  audience: string[];
  /** Known keys or legacy onboarding keys; may include comma-separated entries in one string */
  current_priority: string[];
  communication_style: string[];
  prefered_communication_style: string;
  motivation?: string;
  motivation_detail?: string;
  life_situation?: string;
  life_situation_detail?: string;
  personality_traits?: string[];
  memory_treasures?: string[];
}

export interface OnboardingDetailsResponse {
  onboarding_status: OnboardingStatus;
  user: OnboardingDetailsUser;
  persona: OnboardingDetailsPersona;
}

export interface SaveOnboardingApiBody {
  first_name?: string;
  last_name?: string;
  nickname?: string;
  age_range?: string;
  location?: string;
  step?: number;
  join_reasons?: string[];
  audience?: string[];
  current_priority?: string[];
  prefered_communication_style?: string;
  /** Extended onboarding (optional; backend may ignore until supported) */
  life_situation?: string;
  life_situation_detail?: string;
  personality_traits?: string[];
  memory_treasures?: string[];
  chronotype?: string;
  sharing_intent?: string;
  motivation_detail?: string;
}

/** Frontend payload: same shape as before for callers */
export interface SaveOnboardingBody {
  fullName: string;
  displayName: string;
  ageBand: string;
  whereFrom?: string;
  mementoFor: string[];
  mementoForFreetext?: string;
  passions: string[];
  passionsFreetext?: string;
  lifeContext: string[];
  motivationType: string;
  priorityDimensions: string[];
  dimensionsFreetext?: string;
  expressionMode: string[];
  isComplete: boolean;
  stepReached: number;
  lifeSituation?: string;
  lifeSituationDetail?: string;
  personalityTraits?: string[];
  memoryTreasures?: string[];
  chronotype?: string;
  sharingIntent?: string;
  motivationDetail?: string;
  skippedDeepPersonalization?: boolean;
}

const PASSION_KEYS: readonly PassionKey[] = [
  "food_cooking",
  "travel_places",
  "faith_spirituality",
  "music",
  "sports_fitness",
  "reading_learning",
  "nature_outdoors",
  "art_creativity",
  "family_history_heritage",
  "family_relationships",
  "ideas_how_things_work",
  "business_entrepreneurship",
  "community_service",
  "technology",
  "something_else",
] as const;

function isPassionKey(s: string): s is PassionKey {
  return (PASSION_KEYS as readonly string[]).includes(s);
}

function splitKnownValues<T extends string>(
  values: string[] | undefined,
  known: readonly T[],
): { knownValues: T[]; extraValues: string[] } {
  const knownSet = new Set<string>(known);
  const knownValues: T[] = [];
  const extraValues: string[] = [];

  for (const value of values ?? []) {
    if (knownSet.has(value)) {
      knownValues.push(value as T);
    } else if (value.trim()) {
      extraValues.push(value.trim());
    }
  }

  return { knownValues, extraValues };
}

/** Map frontend state to API POST /users/onboarding body */
function mapStateToApiBody(body: SaveOnboardingBody): SaveOnboardingApiBody {
  const parts = body.fullName.trim().split(/\s+/);
  const first_name = parts[0] ?? "";
  const last_name = parts.slice(1).join(" ") ?? "";
  const join_reasons = [
    ...body.passions,
    ...(body.passionsFreetext?.trim() ? [body.passionsFreetext.trim()] : []),
    ...(body.personalityTraits ?? []),
    ...(body.memoryTreasures ?? []),
  ];
  const audience = [
    ...body.mementoFor,
    ...(body.mementoForFreetext?.trim() ? [body.mementoForFreetext.trim()] : []),
  ];
  const current_priority = [
    ...body.priorityDimensions,
    ...(body.dimensionsFreetext?.trim() ? [body.dimensionsFreetext.trim()] : []),
  ];
  return {
    first_name: first_name || undefined,
    last_name: last_name || undefined,
    nickname: body.displayName?.trim() || undefined,
    age_range: body.ageBand?.trim() || undefined,
    location: body.whereFrom?.trim() || undefined,
    step: body.stepReached ?? 8,
    join_reasons: join_reasons.length ? join_reasons : undefined,
    audience: audience.length ? audience : undefined,
    current_priority: current_priority.length ? current_priority : undefined,
    prefered_communication_style:
      body.expressionMode?.[0]?.trim() || undefined,
    life_situation: body.lifeSituation?.trim() || undefined,
    life_situation_detail: body.lifeSituationDetail?.trim() || undefined,
    personality_traits:
      body.personalityTraits && body.personalityTraits.length
        ? body.personalityTraits
        : undefined,
    memory_treasures:
      body.memoryTreasures && body.memoryTreasures.length
        ? body.memoryTreasures
        : undefined,
    chronotype: body.chronotype?.trim() || undefined,
    sharing_intent: body.sharingIntent?.trim() || undefined,
    motivation_detail: body.motivationDetail?.trim() || undefined,
  };
}

/** Save onboarding on completion. POST /users/onboarding */
export async function saveOnboarding(
  body: SaveOnboardingBody
): Promise<{ success: boolean }> {
  try {
    const apiBody = mapStateToApiBody(body);
    const res = await post<unknown>(endpoint.onboarding, apiBody);
    const status = (res as { status?: number })?.status;
    return { success: status === 200 };
  } catch {
    return { success: false };
  }
}

/** Map API onboarding-details response to Partial<OnboardingState> for prefill */
export function mapOnboardingDetailsToState(
  data: OnboardingDetailsResponse
): Partial<OnboardingState> {
  const { user, persona } = data;
  const joinReasons = persona.join_reasons ?? [];
  const passions: PassionKey[] = [];
  const otherReasons: string[] = [];
  for (const r of joinReasons) {
    if (isPassionKey(r)) passions.push(r);
    else otherReasons.push(r);
  }
  const fullName =
    (user.full_name?.trim()) ||
    [user.first_name, user.last_name].filter(Boolean).join(" ");
  return {
    fullName,
    displayName: user.nickname ?? "",
    ageBand: (user.age_range as AgeBand) || null,
    whereFrom: user.location ?? "",
    mementoFor: (persona.audience ?? []) as MementoFor[],
    passions,
    passionsFreetext: otherReasons.join(", "),
    priorityDimensions: migrateLegacyPriorityList(persona.current_priority ?? []),
    expressionMode: persona.prefered_communication_style
      ? ([persona.prefered_communication_style] as ExpressionMode[])
      : [],
    isRevisitMode: true,
  };
}

const MISC_MOTIVATION_KEYS = [
  "self_understanding",
  "personal_space",
  "memory_preservation",
  "emotional_depth",
  "explorer",
  "something_else",
] as const satisfies readonly MiscMotivationChip[];

const LIFE_SITUATION_KEYS = [
  "run_business",
  "work_organization",
  "retired",
  "caregiver",
  "student",
  "between_things",
  "something_else",
] as const satisfies readonly LifeSituationKey[];

const PERSONALITY_TRAIT_KEYS = [
  "warm_caring",
  "thoughtful_quiet",
  "funny_lighthearted",
  "driven_focused",
  "creative_expressive",
  "spiritual_reflective",
  "curious_everything",
  "strong_dependable",
  "something_else",
] as const satisfies readonly PersonalityTraitKey[];

const MEMORY_TREASURE_KEYS = [
  "quiet_mornings",
  "family_gatherings",
  "big_adventures",
  "turning_points",
  "everyday_small_things",
  "people_shaped_me",
  "funny_stories",
  "learned_hard_way",
] as const satisfies readonly MemoryTreasureKey[];

const CHRONOTYPE_KEYS = ["morning", "night"] as const satisfies readonly ChronotypeKey[];

const SHARING_INTENT_KEYS = [
  "private_vault",
  "shared_legacy",
] as const satisfies readonly SharingIntentKey[];

export function mapOnboardingDetailsToMiscState(
  data: OnboardingDetailsResponse,
): Partial<OnboardQuestionsState> {
  const { user, persona } = data;
  const motivationChips = Array.from(
    new Set(
      [
        persona.motivation,
        ...(persona.join_reasons ?? []),
      ].filter(
        (value): value is MiscMotivationChip =>
          Boolean(value) &&
          MISC_MOTIVATION_KEYS.includes(value as MiscMotivationChip),
      ),
    ),
  );
  if (motivationChips.length === 0 && persona.motivation_detail?.trim()) {
    motivationChips.push("something_else");
  }
  const lifeSituation =
    persona.life_situation &&
    LIFE_SITUATION_KEYS.includes(persona.life_situation as LifeSituationKey)
      ? (persona.life_situation as LifeSituationKey)
      : persona.life_situation_detail?.trim()
        ? "something_else"
        : null;
  const chronotype =
    user.chronotype && CHRONOTYPE_KEYS.includes(user.chronotype as ChronotypeKey)
      ? (user.chronotype as ChronotypeKey)
      : null;
  const sharingIntent =
    user.sharing_intent &&
    SHARING_INTENT_KEYS.includes(user.sharing_intent as SharingIntentKey)
      ? (user.sharing_intent as SharingIntentKey)
      : null;

  const { knownValues: personalityTraits } = splitKnownValues(
    persona.personality_traits,
    PERSONALITY_TRAIT_KEYS,
  );
  const { knownValues: memoryTreasures } = splitKnownValues(
    persona.memory_treasures,
    MEMORY_TREASURE_KEYS,
  );
  const { knownValues: passions, extraValues: passionExtras } = splitKnownValues(
    persona.join_reasons,
    PASSION_KEYS,
  );

  return {
    step:
      typeof user.onboarding_step_reached === "number" &&
      user.onboarding_step_reached >= 1 &&
      user.onboarding_step_reached <= 12
        ? (user.onboarding_step_reached as OnboardQuestionsState["step"])
        : 12,
    motivationChips,
    motivationDetail: persona.motivation_detail ?? "",
    ageBand: (user.age_range as AgeBand) || null,
    lifeSituation,
    lifeSituationDetail: persona.life_situation_detail ?? "",
    homePlace: user.location ?? "",
    personalityTraits,
    memoryTreasures,
    passions,
    passionsDetail: passionExtras.join(", "),
    chronotype,
    sharingIntent,
    priorityDimensions: migrateLegacyPriorityList(
      persona.current_priority ?? user.priority_dimensions ?? [],
    ),
    skippedDeepPersonalization: Boolean(user.skipped_deep_personalization),
  };
}

/** Fetch onboarding data for revisit/prefill. GET /users/onboarding-details */
export async function fetchOnboardingDetails(): Promise<OnboardingDetailsResponse | null> {
  try {
    const res = await get<OnboardingDetailsResponse>(endpoint.onboardingDetails);
    const data = (res as { data?: OnboardingDetailsResponse })?.data;
    return data ?? null;
  } catch {
    return null;
  }
}
