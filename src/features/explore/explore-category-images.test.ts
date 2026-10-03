import { describe, expect, it } from "vitest";
import {
  EXPLORE_CATEGORY_SLUGS,
  getExploreCategoryImage,
  resolveExploreCategorySlug,
} from "@/utility/data/categories";
import * as categoryPresentation from "@/utility/data/categories";

describe("Explore category presentation mapping", () => {
  it("provides temporary artwork for every canonical category", () => {
    expect(EXPLORE_CATEGORY_SLUGS).toHaveLength(11);
    for (const slug of EXPLORE_CATEGORY_SLUGS) {
      expect(getExploreCategoryImage(slug)).toBeTruthy();
    }
  });

  it("resolves legacy aliases without treating arbitrary categories as Explore", () => {
    expect(resolveExploreCategorySlug("identity")).toBe("who-i-am");
    expect(resolveExploreCategorySlug("region")).toBe("beliefs-faith");
    expect(resolveExploreCategorySlug("health")).toBeNull();
    expect(getExploreCategoryImage("health")).toBeUndefined();
  });

  it("provides responsive WebP artwork without upscaling a master", () => {
    const getExploreCategoryArtwork = (
      categoryPresentation as typeof categoryPresentation & {
        getExploreCategoryArtwork?: (slug: string) => {
          src: string;
          srcSet: string;
          width: number;
          variants: Array<{ width: number; src: string }>;
        } | undefined;
      }
    ).getExploreCategoryArtwork;

    expect(getExploreCategoryArtwork).toBeTypeOf("function");
    const artwork = getExploreCategoryArtwork?.("what-life-taught-me");
    expect(artwork?.src).toMatch(/\.webp$/);
    expect(artwork?.srcSet).toContain("480w");
    expect(artwork?.variants.every((variant) => variant.width <= (artwork?.width ?? 0))).toBe(true);
    expect(artwork?.variants.some((variant) => variant.width === 1440)).toBe(false);
  });
});
