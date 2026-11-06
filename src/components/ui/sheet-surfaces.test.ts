import { describe, expect, it } from "vitest";

const sources = import.meta.glob<string>("/src/**/*.tsx", { eager: true, query: "?raw", import: "default" });
const sheetSurface = /<Sheet\.(?:Container|Header|Content)\b[^>]*?className="([^"]*)"/g;

/** Any fill other than the shared one shows as an edge or a mismatched band around a sheet's corners. */
describe("bottom sheet surfaces", () => {
  it.each(Object.keys(sources).filter((path) => !path.endsWith(".test.tsx") && sources[path].includes("react-modal-sheet")))(
    "%s uses only the shared fill and no border",
    (path) => {
      for (const [, className] of sources[path].matchAll(sheetSurface)) {
        const stray = className.split(/\s+/).filter((name) => /^!?(bg-|border)/.test(name) && name !== "bg-bg-raised");
        expect(stray, className).toEqual([]);
      }
    },
  );

  it("does not draw a border along the top of the shared bottom sheet", () => {
    expect(sources["/src/components/ui/sheet.tsx"]).not.toContain("data-[side=bottom]:border-t");
  });
});
