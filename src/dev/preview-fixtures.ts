import catalog from "@/features/explore/explore-catalog.generated.json";
import { ENRICHMENT_CATEGORY_OPTIONS } from "@/features/enrichment/enrichment-categories";
import type { UserStatsData } from "@/features/enrichment/enrichment-api.types";
import type { IPrompt } from "@/utility/interface";

export const previewCatalog = catalog;

// Unanswered starter examples, rather than personalized content from the real account.
const questions = [
  "What is a happy memory from when you were growing up?",
  "Who has made a difference in your life?",
  "What does a good day look like for you?",
  "What do you like doing when you have time to yourself?",
  "What is one thing you wish people understood about you?",
  "What is something you would like to become better at?",
  "What values are most important to the way you live?",
  "What traditions remind you of home?",
  "What is a day you remember as being especially fun?",
  "What is a lesson you learned that stayed with you?",
  "Is there something you have always wanted to learn?",
];

export function createStarterPrompts(now: string): IPrompt[] {
  return catalog.map((category, index) => ({
    _id: `preview-prompt-${category.slug}`,
    title: questions[index],
    type: "general",
    category: category.slug,
    category_title: category.title,
    source: "starter",
    status: "unanswered",
    tags: [],
    created_at: now,
    updated_at: now,
  }));
}

export function createStartingStats(
  stories: number,
  reflections: number,
): UserStatsData {
  return {
    streak_count: 0,
    reflections_count: reflections,
    stories_count: stories,
    pending_insights_count: 0,
    enrichment_score: 0,
    category_scores: ENRICHMENT_CATEGORY_OPTIONS.map((category) => ({
      key: category.value,
      label: category.label,
      score: 0,
      weight: 0.1,
      itemCount: 0,
      unlocked: true,
    })),
    lowest_category: null,
    beneficiary_access_unlocked: false,
    milestone: {
      reached_threshold: 0,
      reached_label: "Start",
      reached_description: "",
      next_threshold: 25,
      next_label: "Growing",
      is_max: false,
    },
    nudge: null,
    jump_pills: [],
    spotlight: null,
  };
}
