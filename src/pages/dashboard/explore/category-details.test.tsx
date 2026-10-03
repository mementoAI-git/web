import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import CategoryDetails from "./category-details";
import { setExploreQuestionFeedback } from "@/features/explore/explore-api";

const mutate = vi.fn();

vi.mock("swr/infinite", () => ({
  default: () => ({
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
    setSize: vi.fn(),
    isLoading: false,
    mutate,
  }),
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

    expect(screen.getByRole("button", { name: "All" })).toBeVisible();
    expect(screen.queryByText(/5\/10|unlock personalized/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Mark this question as not relevant" }));
    await waitFor(() =>
      expect(setExploreQuestionFeedback).toHaveBeenCalledWith("prompt-1", {
        status: "not-relevant",
      }),
    );
    expect(mutate).toHaveBeenCalled();
  });
});
