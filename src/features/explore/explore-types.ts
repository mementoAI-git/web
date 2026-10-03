import type { IPagination, IPrompt } from "@/utility/interface";
import type { ExploreCategorySlug } from "@/utility/data/categories";

export interface ExploreCategory {
  slug: ExploreCategorySlug;
  title: string;
  description: string;
  order: number;
  starterTotal: number;
}

export type ExploreQuestionSource = "starter" | "ai-generated" | "legacy";
export type ExploreQuestionStatus = "unanswered" | "answered" | "skipped" | "not-relevant";

export interface ExploreQuestion extends IPrompt {
  category: ExploreCategorySlug;
  source: ExploreQuestionSource;
  status: ExploreQuestionStatus;
}

export interface ExploreCategoryProgress {
  categorySlug: ExploreCategorySlug;
  starterAnswered: number;
  starterTotal: number;
  personalizedQuestionsEnabled: boolean;
}

export interface ExploreQuestionPage extends IPagination<ExploreQuestion> {
  progress?: ExploreCategoryProgress;
}

export interface ExploreQuestionFeedbackInput {
  status: "skipped" | "not-relevant";
}
