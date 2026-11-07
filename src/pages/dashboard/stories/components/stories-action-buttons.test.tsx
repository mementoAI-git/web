import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import { StoriesActionButtons } from "./stories-action-buttons";

describe("StoriesActionButtons", () => {
  it("uses the theme background for the compact secondary action", () => {
    renderWithProviders(
      <StoriesActionButtons
        compactInNav
        onCreateMemory={vi.fn()}
        onQuickCapture={vi.fn()}
      />,
      { route: "/stories", auth: true },
    );

    const quickAdd = screen.getByRole("button", { name: "Quick add" });
    expect(quickAdd).toHaveClass("bg-background");
    expect(quickAdd).not.toHaveClass("bg-white");
  });

  it("offers only Add memory and Quick add on the page", () => {
    renderWithProviders(
      <StoriesActionButtons onCreateMemory={vi.fn()} onQuickCapture={vi.fn()} />,
      { route: "/stories", auth: true },
    );

    expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual([
      "Add memory",
      "Quick add",
    ]);
  });
});
