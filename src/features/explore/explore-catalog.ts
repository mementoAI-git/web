import bundledCatalog from "./explore-catalog.generated.json";
import { resolveExploreCategorySlug } from "@/utility/data/categories";
import type { ExploreCategory } from "./explore-types";

function isExploreCategory(value: unknown): value is ExploreCategory {
  if (!value || typeof value !== "object") return false;
  const category = value as Partial<ExploreCategory>;
  return typeof category.slug === "string"
    && resolveExploreCategorySlug(category.slug) === category.slug
    && typeof category.title === "string"
    && typeof category.description === "string"
    && typeof category.order === "number"
    && typeof category.starterTotal === "number";
}

/** The bundled snapshot is generated from the API taxonomy, never maintained separately. */
export function resolveExploreCatalog(data: unknown): {
  categories: ExploreCategory[];
  usingBundledCatalog: boolean;
} {
  if (Array.isArray(data) && data.length > 0 && data.every(isExploreCategory)) {
    return { categories: data, usingBundledCatalog: false };
  }
  return { categories: bundledCatalog as ExploreCategory[], usingBundledCatalog: true };
}
