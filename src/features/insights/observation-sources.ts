import endpoint from "@/api/endpoint";

export const observationUrl = (id: string) =>
  endpoint.personaObservation.replace(":observationId", id);

export const observationSourcesUrl = (id: string) =>
  `${observationUrl(id)}/sources`;

/** Empty message shared by the hover preview and the sources page. */
export const NO_OBSERVATION_SOURCES =
  "No linked sources. This didn’t come from a specific memory.";
