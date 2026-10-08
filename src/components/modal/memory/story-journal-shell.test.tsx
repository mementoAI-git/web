import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test";
import { StoryJournalShell } from "./story-journal-shell";

describe("StoryJournalShell paper texture", () => {
  it.each(["original", "overlay-b"] as const)(
    "adds faint decorative grain behind content in the light %s presentation",
    (presentation) => {
      localStorage.setItem("memento:theme", "light");
      renderWithProviders(
        <StoryJournalShell presentation={presentation}>
          <div data-testid="story-content" className="relative">Story content</div>
        </StoryJournalShell>,
      );

      const artwork = screen.getByTestId("desktop-album-artwork");
      const grain = screen.getByTestId("desktop-paper-grain");
      expect(grain).toHaveAttribute("alt", "");
      expect(grain).toHaveAttribute("aria-hidden", "true");
      expect(grain).toHaveClass("pointer-events-none", "absolute", "inset-0", "size-full", "object-cover", "object-left-top");
      expect(grain).toHaveStyle({ opacity: "0.1" });
      expect(artwork.nextElementSibling).toBe(grain);
      expect(grain.nextElementSibling).toBe(screen.getByTestId("story-content"));
    },
  );

  it.each(["original", "overlay-b"] as const)(
    "leaves the dark %s artwork without grain",
    (presentation) => {
      localStorage.setItem("memento:theme", "dark");
      renderWithProviders(
        <StoryJournalShell presentation={presentation}>
          <div>Story content</div>
        </StoryJournalShell>,
      );
      expect(screen.getByTestId("desktop-album-artwork")).toBeInTheDocument();
      expect(screen.queryByTestId("desktop-paper-grain")).not.toBeInTheDocument();
    },
  );
});
