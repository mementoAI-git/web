import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test";
import CategoryCard from "./category-card";

describe("CategoryCard", () => {
  it("uses a theme-aware token for the text below the image", () => {
    renderWithProviders(
      <CategoryCard
        image="/topic.jpg"
        subtitle="A reflective topic prompt"
        category="identity"
      />,
      { route: "/overview", auth: true },
    );

    expect(screen.getByText("A reflective topic prompt")).toHaveClass(
      "text-text-neutral-strong",
    );
    expect(screen.getByText("A reflective topic prompt")).not.toHaveClass(
      "text-gray-950/90",
    );
  });
});
