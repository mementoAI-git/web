import type { EnrichmentCategory } from "@/features/enrichment/enrichment-categories";
import type { InsightSource } from "./insights-api.types";

export type ObservationField =
  | "important_notes"
  | "key_preferences"
  | "goals_and_aspirations"
  | "emotional_state_trends";

/** Something Memento has learned about the member, written for them. */
export interface PersonaObservation {
  id: string;
  field: ObservationField;
  heading: string;
  note: string;
  category_key: EnrichmentCategory;
  source_count: number;
}

/** Shape of GET /persona/observations → data */
export interface PersonaObservationsResponse {
  observations: PersonaObservation[];
  /** New facts are being considered, so clients should poll. */
  generating: boolean;
}

/** Shape of GET /persona/observations/:observationId/sources → data */
export interface PersonaObservationSourcesResponse {
  sources: InsightSource[];
}
