import careerImg from "@/assets/image/categories/career.png";
import familyImg from "@/assets/image/categories/family.png";
import relationshipImg from "@/assets/image/categories/relationship.png";
import regionImg from "@/assets/image/categories/region.png";
import purposeImg from "@/assets/image/categories/purpose.png";
import lifeTransitionImg from "@/assets/image/categories/life-transition.png";
import wellbeingImg from "@/assets/image/categories/wellbeing.png";
import identifyImg from "@/assets/image/categories/identify.png";
import experienceImg from "@/assets/image/categories/experience.png";

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

export const LEGACY_EXPLORE_CATEGORY_ALIASES: Record<string, ExploreCategorySlug> = {
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

/** Temporary presentation assets. Dedicated category artwork will replace these later. */
const categoryImages: Record<ExploreCategorySlug, string> = {
  "growing-up": familyImg,
  "people-i-love": relationshipImg,
  "the-life-i-live": wellbeingImg,
  "things-i-love": experienceImg,
  "who-i-am": identifyImg,
  "work-purpose": careerImg,
  "beliefs-faith": regionImg,
  "where-i-come-from": familyImg,
  "stories-adventures": experienceImg,
  "what-life-taught-me": lifeTransitionImg,
  "whats-ahead": purposeImg,
};

const canonicalSlugs = new Set<string>(EXPLORE_CATEGORY_SLUGS);

export function resolveExploreCategorySlug(value?: string | null): ExploreCategorySlug | null {
  const normalized = String(value || "").trim().toLowerCase();
  if (canonicalSlugs.has(normalized)) return normalized as ExploreCategorySlug;
  return LEGACY_EXPLORE_CATEGORY_ALIASES[normalized] ?? null;
}

export function getExploreCategoryImage(value?: string | null): string | undefined {
  const slug = resolveExploreCategorySlug(value);
  return slug ? categoryImages[slug] : undefined;
}

export default categoryImages;
