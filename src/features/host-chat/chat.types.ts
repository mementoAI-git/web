/**
 * Host Chat — shared types (aligned with Enrichment Score categories).
 * @see docs/MEMENTO_ENRICHMENT_SCORE.md
 */
import type { EnrichmentCategory } from "@/features/enrichment/enrichment-categories";
import { enrichmentCategoryLabel } from "@/features/enrichment/enrichment-categories";

/** Life area for deep-dive mode — same keys as `EnrichmentCategory` / onboarding priorities. */
export type LifeDimension = EnrichmentCategory;

export type ChatMode = "open" | "deep_dive";

export interface NudgePayload {
  dimension: LifeDimension;
  /** Optional copy from server when API exists */
  title?: string;
  body?: string;
}

export function dimensionLabel(key: LifeDimension): string {
  return enrichmentCategoryLabel(key);
}
