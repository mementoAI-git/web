import type { InsightSource } from "./insights-api.types";

export type ObservationField =
  | "important_notes"
  | "key_preferences"
  | "goals_and_aspirations"
  | "emotional_state_trends";

/** One thing Memento has learned about the member. */
export interface PersonaObservation {
  id: string;
  field: ObservationField;
  content: string;
  /** False until the member has confirmed or edited it. */
  reviewed: boolean;
  source_count: number;
}

/** Shape of GET /persona/observations → data */
export interface PersonaObservationsResponse {
  observations: PersonaObservation[];
}

/** Shape of GET /persona/observations/:observationId/sources → data */
export interface PersonaObservationSourcesResponse {
  sources: InsightSource[];
}
