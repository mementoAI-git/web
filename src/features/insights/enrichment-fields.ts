import type { EnrichmentCategory } from "@/features/enrichment/enrichment-categories";

export interface EnrichmentField {
  key: EnrichmentCategory;
  label: string;
  description: string;
}

/** Display order and copy for the enrichment fields table. */
export const ENRICHMENT_FIELDS: readonly EnrichmentField[] = [
  {
    key: "memories_experiences",
    label: "Memories and Experiences",
    description: "The moments and milestones that shaped you",
  },
  {
    key: "heritage_roots",
    label: "Heritage and Roots",
    description: "Family, culture, background and upbringing",
  },
  {
    key: "lessons_wisdom",
    label: "Lessons & Wisdom",
    description: "What you’ve learned and how you’ve grown",
  },
  {
    key: "relationships_people",
    label: "Relationships & People",
    description: "The people who matter and your connections",
  },
  {
    key: "beliefs_worldview",
    label: "Beliefs & Worldview",
    description: "Your values, opinions and perspectives on life",
  },
  {
    key: "passions_interests",
    label: "Passions & Interests",
    description: "The things that excite and inspire you",
  },
  {
    key: "hopes_legacy",
    label: "Hopes & Legacy",
    description: "Your dreams, future hopes and legacy",
  },
  {
    key: "work_purpose",
    label: "Work & Purpose",
    description: "Your career, goals and sense of purpose",
  },
  {
    key: "everyday_life",
    label: "Everyday Life",
    description: "Your routines, habits and day-to-day moments",
  },
  {
    key: "identity_self",
    label: "Identity & Self",
    description: "Your self-perception, personality and identity",
  },
];

const FIELD_BY_KEY = new Map(ENRICHMENT_FIELDS.map((field) => [field.key, field]));

export function getEnrichmentField(key: EnrichmentCategory): EnrichmentField {
  return FIELD_BY_KEY.get(key) ?? { key, label: key, description: "" };
}

/** Theme-aware color token for a field, defined in the insights stylesheet. */
export function enrichmentFieldColor(key: EnrichmentCategory): string {
  return `var(--enrichment-${key.replace(/_/g, "-")})`;
}
