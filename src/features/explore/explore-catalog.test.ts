import { describe, expect, it } from "vitest";
import { resolveExploreCatalog } from "./explore-catalog";

describe("Explore catalog compatibility", () => {
  it("uses the bundled approved catalog for legacy, missing, or malformed responses", () => {
    for (const response of [undefined, [], ["career", "region"], [{ slug: "who-i-am" }]]) {
      const catalog = resolveExploreCatalog(response);
      expect(catalog.categories).toHaveLength(11);
      expect(catalog.usingBundledCatalog).toBe(true);
      expect(catalog.categories.find(category => category.slug === "beliefs-faith")?.title).toBe("Beliefs & Faith");
    }
  });

  it("uses valid category objects returned by the API", () => {
    const categories = [{ slug: "who-i-am", title: "Who I Am", description: "Identity", order: 4, starterTotal: 10 }];
    expect(resolveExploreCatalog(categories)).toEqual({ categories, usingBundledCatalog: false });
  });
});
