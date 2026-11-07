import { expect, it } from "vitest";
import { render } from "@testing-library/react";
import { ALL_ENRICHMENT_CATEGORY_KEYS } from "@/features/enrichment/enrichment-categories";
import { EnrichmentFieldIcon } from "./enrichment-field-icon";
import {
  ENRICHMENT_FIELDS,
  enrichmentFieldColor,
  getEnrichmentField,
} from "./enrichment-fields";

it("covers every enrichment category exactly once", () => {
  expect(ENRICHMENT_FIELDS.map((field) => field.key).sort()).toEqual(
    [...ALL_ENRICHMENT_CATEGORY_KEYS].sort(),
  );
});

it("resolves a theme token for a field", () => {
  expect(enrichmentFieldColor("identity_self")).toBe(
    "var(--enrichment-identity-self)",
  );
  expect(getEnrichmentField("work_purpose").label).toBe("Work & Purpose");
});

it.each(ALL_ENRICHMENT_CATEGORY_KEYS)("draws an icon for %s", (field) => {
  const { container } = render(<EnrichmentFieldIcon field={field} />);
  const svg = container.querySelector("svg")!;
  expect(svg.children.length).toBeGreaterThan(0);
  expect(svg.getAttribute("style")).toContain(enrichmentFieldColor(field));
});
