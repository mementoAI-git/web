import { describe, expect, it } from "vitest";
import {
  EXPLORE_CATEGORY_SLUGS,
  getExploreCategoryImage,
  resolveExploreCategorySlug,
} from "@/utility/data/categories";

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
});
