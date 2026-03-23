/**
 * Host Chat — shared types (aligned with onboarding life dimensions).
 */
import type { DimensionKey } from "@/features/onboarding-groot/types";
import { DIMENSION_OPTIONS } from "@/features/onboarding-groot/types";

/** Life area for deep-dive mode (same keys as onboarding `DimensionKey`). */
export type LifeDimension = DimensionKey;

export type ChatMode = "open" | "deep_dive";

export interface NudgePayload {
  dimension: LifeDimension;
  /** Optional copy from server when API exists */
  title?: string;
  body?: string;
}

export function dimensionLabel(key: LifeDimension): string {
  return DIMENSION_OPTIONS.find((o) => o.value === key)?.label ?? key;
}

/** Stub enrichment until `GET …/enrichment` (or similar) exists. */
export const HOST_CHAT_ENRICHMENT_STUB_PERCENT = 47;
