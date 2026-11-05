import type { EnrichmentCategory } from "@/features/enrichment/enrichment-categories";

/** One connection Memento surfaced. Relates to every field in `categories`. */
export interface Insight {
  id: string;
  title: string;
  body: string;
  categories: EnrichmentCategory[];
  source_count: number;
}

/** Shape of GET /users/insights → data */
export interface InsightList {
  insights: Insight[];
  generated_at: string | null;
  next_refresh_at: string | null;
  /** A new batch is being prepared, so clients should poll. */
  generating: boolean;
}

export interface InsightSource {
  id: string;
  title: string;
  type: "story" | "conversation";
  created_at: string | null;
  thumbnail: string | null;
}

/** Shape of GET /users/insights/sources → data */
export interface InsightSourceList {
  sources: InsightSource[];
}
