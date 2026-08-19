import { describe, expect, it } from "vitest";
import endpoint from "./endpoint";

describe("persona observation endpoints", () => {
  it("exposes list and detail URL templates", () => {
    expect(endpoint.personaObservations).toBe("/persona/observations");
    expect(endpoint.personaObservation).toBe(
      "/persona/observations/:observationId",
    );
  });
});
