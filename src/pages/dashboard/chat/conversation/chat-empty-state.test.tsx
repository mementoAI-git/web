import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import { ChatEmptyState } from "./chat-empty-state";

describe("ChatEmptyState", () => {
  it("introduces Memento chat and sends either suggested prompt", async () => {
    const user = userEvent.setup();
    const onPrompt = vi.fn();
    renderWithProviders(<ChatEmptyState onPrompt={onPrompt} />, { auth: true });

    expect(screen.getByRole("heading", { name: "Chat with Memento AI" })).toBeInTheDocument();
    expect(screen.getByText(/the more you chat, the better your ai becomes/i)).toBeInTheDocument();

    const childhood = screen.getByRole("button", { name: /share a story from my childhood/i });
    const values = screen.getByRole("button", { name: /what are some of my core values/i });
    await user.click(childhood);
    await user.click(values);

    expect(onPrompt).toHaveBeenNthCalledWith(1, "Share a story from my childhood");
    expect(onPrompt).toHaveBeenNthCalledWith(2, "What are some of my core values?");
  });
});
