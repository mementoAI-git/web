import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import CategoryPromptCard from "./category-prompt-card";

describe("CategoryPromptCard", () => {
  it("offers separate accessible reply, skip, and not-relevant actions", async () => {
    const user = userEvent.setup();
    const onFeedback = vi.fn();
    renderWithProviders(
      <CategoryPromptCard
        _id="prompt-1"
        title="What makes an ordinary day better?"
        source="starter"
        onFeedback={onFeedback}
      />,
      { route: "/explore/categories/the-life-i-live", auth: true },
    );

    expect(screen.getByRole("link", { name: /reply/i })).toHaveAttribute(
      "href",
      "/chat/reply/prompt-1",
    );
    await user.click(screen.getByRole("button", { name: "Skip this question" }));
    expect(onFeedback).toHaveBeenCalledWith("prompt-1", "skipped");
    await user.click(screen.getByRole("button", { name: "Mark this question as not relevant" }));
    expect(onFeedback).toHaveBeenCalledWith("prompt-1", "not-relevant");
  });

  it("labels personalized questions without exposing an unlock", () => {
    renderWithProviders(
      <CategoryPromptCard
        _id="prompt-2"
        title="What would you love to make next?"
        source="ai-generated"
        onFeedback={vi.fn()}
      />,
      { auth: true },
    );
    expect(screen.getByText("Just for you")).toBeVisible();
    expect(screen.queryByText(/unlock/i)).not.toBeInTheDocument();
  });
});
