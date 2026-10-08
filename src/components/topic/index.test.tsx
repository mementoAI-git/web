import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test";
import Topic from "./index";
import {
  EXPLORE_CATEGORY_SLUGS,
  getExploreCategoryImage,
} from "@/utility/data/categories";

describe("Suggested topic artwork", () => {
  it("uses current Work & Purpose artwork as its fallback", () => {
    const { container } = renderWithProviders(
      <Topic title="A conversation starter" />,
    );
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      getExploreCategoryImage("work-purpose"),
    );
  });
  it.each(EXPLORE_CATEGORY_SLUGS)(
    "renders the current %s artwork supplied by suggested conversations",
    (slug) => {
      const { container } = renderWithProviders(
        <Topic
          title="A conversation starter"
          image={getExploreCategoryImage(slug)}
        />,
      );
      expect(container.querySelector("img")?.getAttribute("src")).toContain(
        `/categories/generated/${slug}-480.webp`,
      );
    },
  );
});
