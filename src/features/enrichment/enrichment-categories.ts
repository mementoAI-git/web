/**
 * Enrichment Score — canonical life categories (single source of truth).
 * @see docs/MEMENTO_ENRICHMENT_SCORE.md
 *
 * Onboarding “priority dimensions” and Host Chat deep-dive use these keys.
 * Legacy onboarding keys from the API are migrated via `migrateLegacyPriorityDimension`.
 */

export type EnrichmentCategory =
  | "identity_self"
  | "relationships_people"
  | "work_purpose"
  | "memories_experiences"
  | "beliefs_worldview"
  | "passions_interests"
  | "heritage_roots"
  | "lessons_wisdom"
  | "hopes_legacy"
  | "everyday_life";

export const ALL_ENRICHMENT_CATEGORY_KEYS: readonly EnrichmentCategory[] = [
  "identity_self",
  "relationships_people",
  "work_purpose",
  "memories_experiences",
  "beliefs_worldview",
  "passions_interests",
  "heritage_roots",
  "lessons_wisdom",
  "hopes_legacy",
  "everyday_life",
] as const;

/** Categories not offered during initial onboarding (unlock later in product). */
export const DEFERRED_ENRICHMENT_CATEGORIES: ReadonlyArray<EnrichmentCategory> = [
  "lessons_wisdom",
  "hopes_legacy",
];

export interface EnrichmentCategoryOption {
  value: EnrichmentCategory;
  label: string;
  sublabel: string;
  icon: string;
}

/**
 * All 10 categories — copy aligned with Enrichment Score product spec.
 */
export const ENRICHMENT_CATEGORY_OPTIONS: EnrichmentCategoryOption[] = [
  {
    value: "identity_self",
    label: "Identity & Self",
    sublabel:
      "Personality, values, self-perception, growth, pride, and how you handle difficulty.",
    icon: "🪞",
  },
  {
    value: "relationships_people",
    label: "Relationships & People",
    sublabel:
      "Family, friends, partners, mentors — the people who matter and how those bonds shaped you.",
    icon: "🤝",
  },
  {
    value: "work_purpose",
    label: "Work & Purpose",
    sublabel: "Career arc, what drove your choices, what you built, pivots, and professional identity.",
    icon: "🔨",
  },
  {
    value: "memories_experiences",
    label: "Memories & Experiences",
    sublabel: "Events, places, turning points, firsts, adventures — the stories that make a life feel lived.",
    icon: "📚",
  },
  {
    value: "beliefs_worldview",
    label: "Beliefs & Worldview",
    sublabel: "Faith, philosophy, politics, ethics — ideas you hold, distinct from day-to-day personality.",
    icon: "🕯️",
  },
  {
    value: "passions_interests",
    label: "Passions & Interests",
    sublabel: "Hobbies, obsessions, what you make, what you’d talk about for hours.",
    icon: "🌟",
  },
  {
    value: "heritage_roots",
    label: "Heritage & Roots",
    sublabel: "Culture, origin stories, traditions, language, place, and ancestry.",
    icon: "🗺️",
  },
  {
    value: "lessons_wisdom",
    label: "Lessons & Wisdom",
    sublabel:
      "Hard-won realisations, advice you give, mistakes you learned from — unlocks after you’ve been active a while.",
    icon: "🌊",
  },
  {
    value: "hopes_legacy",
    label: "Hopes & Legacy",
    sublabel:
      "What you want remembered, letters unsaid, what you’re still building toward — unlocks after sustained use.",
    icon: "💌",
  },
  {
    value: "everyday_life",
    label: "Everyday Life",
    sublabel: "Routines, food, comfort rituals, pet peeves, small joys — ordinary days that humanise you.",
    icon: "☕",
  },
];

/** Shown in onboarding step “what matters most” — excludes deferred categories. */
export const ONBOARDING_ENRICHMENT_CATEGORY_OPTIONS: EnrichmentCategoryOption[] =
  ENRICHMENT_CATEGORY_OPTIONS.filter(
    (o) => !DEFERRED_ENRICHMENT_CATEGORIES.includes(o.value),
  );

const OPTION_BY_VALUE = new Map(
  ENRICHMENT_CATEGORY_OPTIONS.map((o) => [o.value, o]),
);

/** Map pre–Enrichment Spec API / persisted keys → canonical category. */
const LEGACY_DIMENSION_TO_ENRICHMENT: Record<string, EnrichmentCategory> = {
  people_relationships: "relationships_people",
  memories_stories: "memories_experiences",
  beliefs_values: "beliefs_worldview",
  heritage_roots: "heritage_roots",
  passions_interests: "passions_interests",
  work_purpose: "work_purpose",
  wishes_letters: "hopes_legacy",
  everyday_life: "everyday_life",
  hardships_resilience: "lessons_wisdom",
  humour_personality: "identity_self",
};

const CANONICAL_SET = new Set<string>(ALL_ENRICHMENT_CATEGORY_KEYS);

export function isEnrichmentCategoryKey(s: string): s is EnrichmentCategory {
  return CANONICAL_SET.has(s);
}

/**
 * Normalize a single token from API or CSV `current_priority` to a canonical category, or null if unknown.
 */
export function migrateLegacyPriorityDimension(
  raw: string,
): EnrichmentCategory | null {
  const t = raw.trim();
  if (!t) return null;
  if (isEnrichmentCategoryKey(t)) return t;
  return LEGACY_DIMENSION_TO_ENRICHMENT[t] ?? null;
}

/** Deduplicated list for prefill after loading onboarding details. */
export function migrateLegacyPriorityList(raw: string[]): EnrichmentCategory[] {
  const tokens = raw.flatMap((s) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
  );
  const out: EnrichmentCategory[] = [];
  const seen = new Set<EnrichmentCategory>();
  for (const s of tokens) {
    const m = migrateLegacyPriorityDimension(s);
    if (m && !seen.has(m)) {
      seen.add(m);
      out.push(m);
    }
  }
  return out;
}

export function enrichmentCategoryLabel(key: EnrichmentCategory): string {
  return OPTION_BY_VALUE.get(key)?.label ?? key;
}

/**
 * Display token for settings / insights: map known keys to labels; keep free-text as-is.
 */
export function formatEnrichmentPriorityTokenForDisplay(raw: string): string {
  const t = raw.trim();
  const m = migrateLegacyPriorityDimension(t);
  if (m) return enrichmentCategoryLabel(m);
  return t;
}

/** Comma-separated `current_priority` string or joined array → human-readable list. */
export function formatEnrichmentPriorityForDisplay(
  raw: string | string[] | undefined,
): string {
  if (raw == null) return "";
  const parts = Array.isArray(raw)
    ? raw
    : raw.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.map(formatEnrichmentPriorityTokenForDisplay).filter(Boolean).join(", ");
}

function cleanFocusFragment(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/[.…,;]+$/g, "")
    .trim();
}

/** Resolved, trimmed focus labels (one entry per priority token). */
export function enrichmentPriorityDisplayParts(
  raw: string | string[] | undefined,
): string[] {
  if (raw == null) return [];
  const tokens = Array.isArray(raw)
    ? raw
    : raw.split(",").map((t) => t.trim()).filter(Boolean);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of tokens) {
    const displayed = formatEnrichmentPriorityTokenForDisplay(t);
    if (!displayed) continue;
    const cleaned = cleanFocusFragment(displayed);
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
  }
  return out;
}

/**
 * One readable first-person sentence for Memory Insights (avoids "My focus: A, B, C" comma splices).
 */
export function formatCurrentPriorityAsFocusSentence(
  raw: string | string[] | undefined,
): string {
  const parts = enrichmentPriorityDisplayParts(raw);
  if (parts.length === 0) return "";
  if (parts.length === 1) {
    return `Right now I'm most focused on ${parts[0]}.`;
  }
  if (parts.length === 2) {
    return `Right now I'm most focused on ${parts[0]} and ${parts[1]}.`;
  }
  const head = parts.slice(0, -1).join(", ");
  const last = parts[parts.length - 1];
  return `Right now I'm most focused on ${head}, and ${last}.`;
}
