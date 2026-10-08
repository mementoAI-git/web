import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test";
import CategoryCard from "./category-card";

describe("CategoryCard", () => {
  it("uses weak text for category descriptions", () => {
    renderWithProviders(
      <CategoryCard
        image="/topic.jpg"
        subtitle="A reflective topic prompt"
        category="identity"
      />,
      { route: "/overview", auth: true },
    );

    expect(screen.getByText("A reflective topic prompt")).toHaveClass(
      "text-text-neutral-weak",
    );
    expect(screen.getByText("A reflective topic prompt")).not.toHaveClass(
      "text-gray-950/90",
    );
  });

  it("renders responsive category artwork with explicit loading behavior", () => {
    const { container } = renderWithProviders(
      <CategoryCard
        image="/topic.jpg"
        subtitle="Growing Up"
        {...({
          imageCategory: "growing-up",
          imageLoading: "eager",
          imageSizes: "(min-width: 768px) 33vw, 100vw",
        } as Record<string, string>)}
      />,
      { route: "/explore", auth: true },
    );

    const image = container.querySelector("img");
    expect(image).toHaveAttribute("srcset");
    expect(image?.getAttribute("srcset")).toContain("480w");
    expect(image).toHaveAttribute("sizes", "(min-width: 768px) 33vw, 100vw");
    expect(image).toHaveAttribute("loading", "eager");
    expect(image).toHaveAttribute("fetchpriority", "high");
    expect(image).toHaveAttribute("width");
    expect(image).toHaveAttribute("height");
    expect(image).toHaveAttribute("alt", "");
  });
});
