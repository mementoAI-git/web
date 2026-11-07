import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test";
import type { IMemory } from "@/utility/interface";
import { StoriesMobileList } from "./list-mobile";

const memory = {
  _id: "story-1",
  title: "Quick note",
  body: "<p>The body text</p>",
  summary: "An AI summary",
  tags: ["Music", "Learning", "Family"],
  attachments: [],
  status: "published",
  created_at: "2026-11-06T12:00:00.000Z",
} as unknown as IMemory;

describe("StoriesMobileList", () => {
  it("shows only the title and date in a 16px card with a 32px icon", () => {
    const { container } = renderWithProviders(
      <StoriesMobileList data={{ docs: [memory] } as never} />,
      { route: "/stories", auth: true },
    );

    expect(screen.getByRole("heading", { name: "Quick note" })).toBeVisible();
    expect(screen.getByText("Nov 06, 2026")).toBeVisible();
    for (const hidden of ["Music", "Learning", "+1", "An AI summary", "The body text"]) {
      expect(screen.queryByText(hidden)).not.toBeInTheDocument();
    }
    expect(container.querySelector("article")).toHaveClass("rounded-2xl");
    expect(container.querySelector("article .size-8")).toBeInTheDocument();
  });
});
