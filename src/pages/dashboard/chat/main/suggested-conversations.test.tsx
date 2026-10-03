import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import SuggestedCategories from "./suggested-conversations";
import { vi } from "vitest";

const suggestionData = vi.hoisted(() => ({
  data: [{ _id: "prompt-1", title: "A reflection?", category: "work-purpose", category_title: "Work & Purpose" }],
}));

vi.mock("swr", async (importOriginal) => ({
  ...await importOriginal<typeof import("swr")>(),
  default: () => ({ data: suggestionData, isLoading: false }),
}));

describe("SuggestedCategories", () => {
  it("shows the readable category name", () => {
    renderWithProviders(<SuggestedCategories />, { auth: true, route: "/chat" });
    expect(screen.getByText("Work & Purpose")).toBeVisible();
    expect(screen.queryByText("work-purpose")).not.toBeInTheDocument();
  });

  it("does not expose the slug when a category name is missing", () => {
    const previousTitle = suggestionData.data[0].category_title;
    suggestionData.data[0].category_title = "";
    try {
      renderWithProviders(<SuggestedCategories />, { auth: true, route: "/chat" });
      expect(screen.getByText("Question")).toBeVisible();
      expect(screen.queryByText("work-purpose")).not.toBeInTheDocument();
    } finally {
      suggestionData.data[0].category_title = previousTitle;
    }
  });
  it("uses full width up to 560px max on the section shell", () => {
    renderWithProviders(<SuggestedCategories />, { auth: true, route: "/chat" });

    expect(screen.getByText("Suggested Conversations")).toBeInTheDocument();

    const heading = screen.getByText("Suggested Conversations");
    const shell = heading.parentElement?.parentElement;
    expect(shell?.className).toMatch(/w-full/);
    expect(shell?.className).toMatch(/max-w-\[560px\]/);
  });
});
