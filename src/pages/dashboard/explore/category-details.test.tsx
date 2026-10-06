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
    expect(setSize).toHaveBeenCalledWith(1);
    await user.click(screen.getByText("All topics"));
    expect(currentKey).not.toContain("answered=");
  });
});
