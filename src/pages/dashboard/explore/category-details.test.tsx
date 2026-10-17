import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import CategoryDetails from "./category-details";
import { setExploreQuestionFeedback } from "@/features/explore/explore-api";

const mutate = vi.fn();
const setSize = vi.fn();
let currentKey = "";

vi.mock("swr/infinite", () => ({
  default: (getKey: (index: number, previous: null) => string) => {
    currentKey = getKey(0, null);
    return {
      data: [
        {
          data: {
            docs: [
              {
                _id: "prompt-1",
                title: "What makes an ordinary day better?",
                category: "the-life-i-live",
                source: "starter",
                status: "unanswered",
              },
            ],
            totalDocs: 1,
            hasNextPage: false,
          },
        },
      ],
      size: 1,
      setSize,
      isLoading: false,
      mutate,
    };
  },
}));

vi.mock("@/features/explore/explore-api", () => ({
  setExploreQuestionFeedback: vi.fn(),
}));

vi.mock("@/hooks/use-intersection-observer", () => ({
  default: () => false,
}));

describe("CategoryDetails", () => {
  beforeEach(() => {
    vi.mocked(setExploreQuestionFeedback).mockResolvedValue({
      success: true,
      data: null,
      message: "saved",
    });
    mutate.mockResolvedValue(undefined);
  });

  it.each(["light", "dark", "deep-sky"])("uses visible semantic filter colours in the %s theme", async (theme) => {
    localStorage.setItem("memento:theme", theme);
    const user = userEvent.setup();
    renderWithProviders(
      <CategoryDetails category={{
        slug: "the-life-i-live",
        title: "The Life I Live",
        description: "Routines and everyday life.",
        order: 2,
        starterTotal: 10,
      }} />,
      { auth: true },
    );
    const all = screen.getByRole("radio", { name: "All topics" });
    const answered = screen.getByRole("radio", { name: "Answered" });
    for (const button of [all, answered]) {
      expect(button).toHaveClass(
        "text-text-neutral-strong",
        "data-[state=on]:bg-fill-neutral-strong",
        "data-[state=on]:text-text-inverse-strong",
        "data-[state=on]:hover:text-text-inverse-strong",
        "dark:data-[state=on]:bg-fill-inverse-strong",
        "dark:data-[state=on]:text-text-neutral-strong",
        "dark:data-[state=on]:[--color-text-neutral-strong:var(--fill-neutral-strong)]",
        "dark:data-[state=on]:hover:bg-fill-inverse-strong",
        "dark:data-[state=on]:hover:text-text-neutral-strong",
      );
      expect(button).not.toHaveClass("data-[state=on]:text-background");
      expect(button.className).not.toMatch(/#[0-9a-f]/i);
    }
    expect(all).toHaveAttribute("aria-checked", "true");
    await user.click(answered);
    expect(answered).toHaveAttribute("aria-checked", "true");
    expect(all).toHaveAttribute("aria-checked", "false");
  });

  it("keeps progress invisible and saves not-relevant feedback", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CategoryDetails
        category={{
          slug: "the-life-i-live",
          title: "The Life I Live",
          description: "Routines and everyday life.",
          order: 2,
          starterTotal: 10,
        }}
      />,
      { auth: true },
    );

    expect(screen.getByText("All topics")).toBeVisible();
    expect(
      screen.queryByText(/5\/10|unlock personalized/i),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /topic options/i }));
    await user.click(
      screen.getByRole("menuitem", { name: "Not relevant to me" }),
    );
    await waitFor(() =>
      expect(setExploreQuestionFeedback).toHaveBeenCalledWith("prompt-1", {
        status: "not-relevant",
      }),
    );
    expect(mutate).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute(
      "href",
      "/explore",
    );
    await user.click(screen.getByText("Answered"));
    expect(currentKey).toContain("answered=true");
    // SWR resets pagination when the filter key changes.
    expect(currentKey).toContain("page=1");
    await user.click(screen.getByText("All topics"));
    expect(currentKey).not.toContain("answered=");
  });
});
