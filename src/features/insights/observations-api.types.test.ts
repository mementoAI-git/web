import { describe, expect, it } from "vitest";
import type {
  PersonaObservation,
  PersonaObservationResponse,
  PersonaObservationsResponse,
} from "./observations-api.types";

describe("persona observation response types", () => {
  it("models list and detail responses with typed memory and conversation sources", () => {
    const observation: PersonaObservation = {
      id: "observation-1",
      content: "You value quiet Sundays.",
      category_key: "everyday_life",
      source_count: 2,
      sources: [
        { source_id: "memory-1", source_type: "memory", title: "Sunday tea" },
        {
          source_id: "conversation-1",
          source_type: "conversation",
          title: null,
        },
      ],
      created_at: "2026-08-18T12:00:00.000Z",
      updated_at: "2026-08-19T12:00:00.000Z",
      review_status: "active",
    };
    const list: PersonaObservationsResponse = { observations: [observation] };
    const detail: PersonaObservationResponse = { observation };

    expect(list.observations[0].sources?.[0].source_type).toBe("memory");
    expect(detail.observation.content).toBe("You value quiet Sundays.");
  });
});
