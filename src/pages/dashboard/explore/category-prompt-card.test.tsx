import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import CategoryPromptCard from "./category-prompt-card";

describe("CategoryPromptCard", () => {
  it("uses a 32px image and 12px corners on phones, keeping the larger desktop sizes", () => {
    const { container } = renderWithProviders(
      <CategoryPromptCard _id="prompt-1" title="A question" onFeedback={vi.fn()} />,
    );
    expect(container.querySelector("article")).toHaveClass(
      "rounded-[12px]",
      "sm:rounded-3xl",
    );
    expect(container.querySelector("img")).toHaveClass(
      "size-8",
      "sm:h-[113px]",
      "sm:w-[135px]",
    );
  });

  it("opens not-relevant feedback from the menu without navigating", async () => {
    const user = userEvent.setup();
    const onFeedback = vi.fn();
    renderWithProviders(
      <CategoryPromptCard
        _id="prompt-1"
        title="What makes an ordinary day better?"
        onFeedback={onFeedback}
      />,
      { route: "/explore/categories/the-life-i-live", auth: true },
    );
    expect(screen.getByRole("link", { name: /reply to/i })).toHaveAttribute(
      "href",
      "/chat/reply/prompt-1",
    );
    expect(screen.queryByText("Not relevant to me")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /topic options/i }));
    await user.click(
      screen.getByRole("menuitem", { name: "Not relevant to me" }),
    );
    expect(onFeedback).toHaveBeenCalledExactlyOnceWith(
      "prompt-1",
      "not-relevant",
    );
  });

  it("supports keyboard dismissal and prevents duplicate feedback while saving", async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithProviders(
      <CategoryPromptCard
        _id="prompt-1"
        title="A topic"
        onFeedback={vi.fn()}
      />,
    );
    const trigger = screen.getByRole("button", { name: /topic options/i });
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(
      await screen.findByRole("menuitem", { name: "Not relevant to me" }),
    ).toBeVisible();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    unmount();
    renderWithProviders(
      <CategoryPromptCard
        _id="prompt-1"
        title="A topic"
        isFeedbackPending
        onFeedback={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: /topic options/i }),
    ).toBeDisabled();
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
