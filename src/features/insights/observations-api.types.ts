import type { EnrichmentCategory } from "@/features/enrichment/enrichment-categories";

export type PersonaObservationSourceType = "memory" | "conversation";

export interface PersonaObservationSource {
  source_id: string;
  source_type: PersonaObservationSourceType;
  title?: string | null;
}

export type PersonaObservationReviewStatus = "active" | "reviewed";

/** A durable, member-owned observation returned by the persona reservoir. */
export interface PersonaObservation {
  id: string;
  content: string;
  category_key?: EnrichmentCategory | null;
  /** Source metadata is optional for records created before provenance was tracked. */
  sources?: PersonaObservationSource[];
  source_count?: number;
  created_at: string;
  updated_at: string;
  review_status: PersonaObservationReviewStatus;
}

/** `data` payload from GET /persona/observations. */
export interface PersonaObservationsResponse {
  observations: PersonaObservation[];
}

/** `data` payload from GET /persona/observations/:observationId. */
export interface PersonaObservationResponse {
  observation: PersonaObservation;
}
