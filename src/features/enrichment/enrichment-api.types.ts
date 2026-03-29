/**
 * API response types for enrichment-related endpoints.
 * Mirrors the shapes returned by GET /users/stats and GET /memories/:id/enrichment.
 */
import type { EnrichmentCategory } from "./enrichment-categories";

export interface CategoryScore {
  key: EnrichmentCategory;
  label: string;
  score: number;
  weight: number;
  itemCount: number;
  unlocked: boolean;
}

export interface MilestoneInfo {
  reached_threshold: number;
  reached_label: string;
  reached_description: string;
  next_threshold: number | null;
  next_label: string | null;
  is_max: boolean;
}

export interface NudgeQuestion {
  category_key: EnrichmentCategory;
  category_label: string;
  question: string;
}

export interface JumpPill {
  category_key: EnrichmentCategory;
  category_label: string;
  starter: string;
}

/** Shape of GET /users/stats → data */
export interface UserStatsData {
  streak_count: number;
  reflections_count: number;
  stories_count: number;
  pending_insights_count: number;
  enrichment_score: number;
  category_scores: CategoryScore[];
  lowest_category: EnrichmentCategory | null;
  beneficiary_access_unlocked: boolean;
  milestone: MilestoneInfo;
  nudge: NudgeQuestion | null;
  jump_pills: JumpPill[];
}

/** Shape of GET /memories/:id/enrichment → data */
export interface ConversationEnrichmentData {
  memory_id: string;
  dimensions: EnrichmentCategory[];
  category_labels: Partial<Record<EnrichmentCategory, string>>;
  message_count: number;
  last_active: string | null;
}
