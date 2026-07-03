import type { EnrichmentCategory } from "@/features/enrichment/enrichment-categories";
import { enrichmentCategoryLabel } from "@/features/enrichment/enrichment-categories";
import type { MotivationType } from "@/features/onboarding-groot/types";
import {
  LIFE_SITUATION_OPTIONS,
  MEMORY_TREASURE_OPTIONS,
  PERSONALITY_TRAIT_OPTIONS,
  SHARING_INTENT_OPTIONS,
} from "@/features/onboarding-groot/types";
import type { OnboardQuestionsState } from "./misc/useOnboardQuestionsState";

export type PostOnboardingAction =
  | "dashboard"
  | "voice_recorder"
  | "reflection_prompt"
  | "file_upload"
  | "time_capsule";

export interface OnboardingSummarySnapshot {
  nextAction: PostOnboardingAction;
  skippedDeepPersonalization: boolean;
  touchedCategories: EnrichmentCategory[];
  priorityDimensions: EnrichmentCategory[];
  motivationType: MotivationType;
  nickname: string;
  motivationDetail?: string;
  lifeSituation?: OnboardQuestionsState["lifeSituation"];
  lifeSituationDetail?: string;
  homePlace?: string;
  personalityTraits?: OnboardQuestionsState["personalityTraits"];
  personalityDetail?: string;
  memoryTreasures?: OnboardQuestionsState["memoryTreasures"];
  sharingIntent?: OnboardQuestionsState["sharingIntent"];
}

export const ONBOARDING_SUMMARY_STORAGE_KEY =
  "memento:onboarding-summary";

export function deriveTouchedCategoriesFromMiscState(
  state: Pick<
    OnboardQuestionsState,
    | "ageBand"
    | "lifeSituation"
    | "homePlace"
    | "personalityTraits"
    | "memoryTreasures"
    | "passions"
    | "chronotype"
    | "sharingIntent"
    | "priorityDimensions"
  >,
): EnrichmentCategory[] {
  const touched = new Set<EnrichmentCategory>();

  if (state.ageBand) touched.add("identity_self");
  if (state.lifeSituation) touched.add("work_purpose");
  if (state.homePlace.trim()) touched.add("heritage_roots");
  if (state.personalityTraits.length > 0) touched.add("identity_self");
  if (state.memoryTreasures.length > 0) {
    touched.add("memories_experiences");
    touched.add("everyday_life");
  }
  if (state.passions.length > 0) touched.add("passions_interests");
  if (state.chronotype) touched.add("everyday_life");
  if (state.sharingIntent) touched.add("relationships_people");
  for (const category of state.priorityDimensions) touched.add(category);

  return [...touched];
}

export function saveOnboardingSummarySnapshot(
  snapshot: OnboardingSummarySnapshot,
): void {
  sessionStorage.setItem(
    ONBOARDING_SUMMARY_STORAGE_KEY,
    JSON.stringify(snapshot),
  );
}

export function readOnboardingSummarySnapshot():
  | OnboardingSummarySnapshot
  | null {
  try {
    const raw = sessionStorage.getItem(ONBOARDING_SUMMARY_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingSummarySnapshot;
  } catch {
    return null;
  }
}

export function clearOnboardingSummarySnapshot(): void {
  sessionStorage.removeItem(ONBOARDING_SUMMARY_STORAGE_KEY);
}

function firstDefinedLabel<T extends string>(
  options: ReadonlyArray<{ value: T; label: string }>,
  value: T | null | undefined,
): string | null {
  if (!value) return null;
  return options.find((option) => option.value === value)?.label ?? null;
}

function joinNaturalLanguage(values: string[]): string {
  if (values.length === 0) return "";
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function motivationSentence(snapshot: OnboardingSummarySnapshot): string {
  const detail = snapshot.motivationDetail?.trim();
  if (detail) return `I'm here because ${detail}.`;

  switch (snapshot.motivationType) {
    case "self_understanding":
      return "I'm here because I want to understand myself more clearly.";
    case "personal_space":
      return "I'm here because I want one place that holds my life as I live it.";
    case "memory_preservation":
      return "I'm here because I don't want important memories to fade.";
    case "emotional_depth":
      return "I'm here because I want the people I love to truly know me.";
    default:
      return "I'm here because I'm exploring what this could become.";
  }
}

export function buildPersonalizedHostStarter(
  snapshot: OnboardingSummarySnapshot | null,
): string {
  if (!snapshot) {
    return "Hi Memento. Can you ask me a gentle first question and help me begin?";
  }

  const pieces = [
    snapshot.nickname?.trim()
      ? `Hi Memento, it's ${snapshot.nickname.trim()}.`
      : "Hi Memento.",
    motivationSentence(snapshot),
  ];

  const lifeSituationLabel =
    snapshot.lifeSituation === "something_else"
      ? snapshot.lifeSituationDetail?.trim() || null
      : firstDefinedLabel(LIFE_SITUATION_OPTIONS, snapshot.lifeSituation);
  if (lifeSituationLabel) {
    pieces.push(`Right now, ${lifeSituationLabel.charAt(0).toLowerCase()}${lifeSituationLabel.slice(1)}.`);
  }

  const personalityLabels = (snapshot.personalityTraits ?? [])
    .filter((trait) => trait !== "something_else")
    .map((trait) => firstDefinedLabel(PERSONALITY_TRAIT_OPTIONS, trait))
    .filter((trait): trait is string => Boolean(trait))
    .slice(0, 2);
  if (snapshot.personalityDetail?.trim()) {
    personalityLabels.push(snapshot.personalityDetail.trim());
  }
  if (personalityLabels.length > 0) {
    pieces.push(`A few words that feel like me are ${joinNaturalLanguage(personalityLabels).toLowerCase()}.`);
  }

  const firstTreasure = firstDefinedLabel(
    MEMORY_TREASURE_OPTIONS,
    snapshot.memoryTreasures?.[0],
  );
  if (firstTreasure) {
    pieces.push(`One place we could start is ${firstTreasure.toLowerCase()}.`);
  }

  const firstPriority = snapshot.priorityDimensions[0];
  if (firstPriority) {
    pieces.push(`I'd love to focus first on ${enrichmentCategoryLabel(firstPriority).toLowerCase()}.`);
  }

  if (snapshot.homePlace?.trim()) {
    pieces.push(`Home for me is ${snapshot.homePlace.trim()}.`);
  }

  const sharingIntentLabel = firstDefinedLabel(
    SHARING_INTENT_OPTIONS,
    snapshot.sharingIntent,
  );
  if (sharingIntentLabel) {
    pieces.push(`${sharingIntentLabel}.`);
  }

  pieces.push("Can you ask me a gentle first question and help me begin?");
  return pieces.join(" ");
}

export function getPostOnboardingDestination(action: PostOnboardingAction): {
  path: string;
  state?: { openModal: string };
  label: string;
} {
  switch (action) {
    case "voice_recorder":
      return {
        path: "/overview",
        state: { openModal: "create-memory" },
        label: "Record your first memory",
      };
    case "file_upload":
      return {
        path: "/overview",
        state: { openModal: "create-memory" },
        label: "Add your first story",
      };
    case "reflection_prompt":
      return { path: "/explore", label: "Browse prompts" };
    case "time_capsule":
      return { path: "/capsule", label: "Open time capsules" };
    default:
      return { path: "/overview", label: "Go to dashboard" };
  }
}
