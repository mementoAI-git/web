import {
  exploreCategoryArtwork,
  type ExploreCategoryArtwork,
} from "@/features/explore/explore-category-artwork.generated";

export const EXPLORE_CATEGORY_SLUGS = [
  "growing-up",
  "people-i-love",
  "the-life-i-live",
  "things-i-love",
  "who-i-am",
  "work-purpose",
  "beliefs-faith",
  "where-i-come-from",
  "stories-adventures",
  "what-life-taught-me",
  "whats-ahead",
] as const;

export type ExploreCategorySlug = (typeof EXPLORE_CATEGORY_SLUGS)[number];

export const LEGACY_EXPLORE_CATEGORY_ALIASES: Record<
  string,
  ExploreCategorySlug
> = {
  childhood: "growing-up",
  love: "people-i-love",
  relationships: "people-i-love",
  changes: "what-life-taught-me",
  career: "work-purpose",
  family: "people-i-love",
  relationship: "people-i-love",
  region: "beliefs-faith",
  belief: "beliefs-faith",
  purpose: "work-purpose",
  "life-transition": "what-life-taught-me",
  wellbeing: "the-life-i-live",
  identity: "who-i-am",
  "experience-culture": "stories-adventures",
};

const categoryImages = Object.fromEntries(
  EXPLORE_CATEGORY_SLUGS.map((slug) => [
    slug,
    exploreCategoryArtwork[slug].src,
  ]),
) as Record<ExploreCategorySlug, string>;

const canonicalSlugs = new Set<string>(EXPLORE_CATEGORY_SLUGS);

export function resolveExploreCategorySlug(
  value?: string | null,
): ExploreCategorySlug | null {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (canonicalSlugs.has(normalized)) return normalized as ExploreCategorySlug;
  return LEGACY_EXPLORE_CATEGORY_ALIASES[normalized] ?? null;
}

export function getExploreCategoryImage(
  value?: string | null,
): string | undefined {
  const slug = resolveExploreCategorySlug(value);
  return slug ? categoryImages[slug] : undefined;
}

export function getExploreCategoryArtwork(
  value?: string | null,
): ExploreCategoryArtwork | undefined {
  const slug = resolveExploreCategorySlug(value);
  return slug ? exploreCategoryArtwork[slug] : undefined;
}

export default categoryImages;
