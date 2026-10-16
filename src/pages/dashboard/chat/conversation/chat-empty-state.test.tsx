import { useEffect } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import { mockUser } from "@/test/fixtures";
import { useStore } from "@/hooks/use-store";
import type { IUser } from "@/utility/interface";
import { ChatEmptyState } from "./chat-empty-state";

function SeedUser({ profile, onPrompt }: { profile: IUser; onPrompt: (prompt: string) => void }) {
  const { setUser } = useStore();
  useEffect(() => { setUser(profile); }, [profile, setUser]);
  return <ChatEmptyState onPrompt={onPrompt} />;
}

describe("ChatEmptyState", () => {
  it("helps a new user share and grounds the summary in completed onboarding", async () => {
    const user = userEvent.setup();
    const onPrompt = vi.fn();
    renderWithProviders(<SeedUser profile={mockUser} onPrompt={onPrompt} />, { auth: true });
    expect(screen.getByRole("heading", { name: "Chat with your Memento" })).toBeInTheDocument();
    expect(screen.getByLabelText("Your avatar")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Help me share my first memory" }));
    await user.click(screen.getByRole("button", { name: "What do you know about me so far?" }));
    expect(onPrompt).toHaveBeenNthCalledWith(1, "Help me share my first memory. Ask me one simple question at a time to help me get started.");
    expect(onPrompt).toHaveBeenNthCalledWith(2, "Summarize what I shared during onboarding. Use only information I actually provided, and ask me about anything you don't know yet.");
  });

  it.each(["skipped", "never"] as const)("offers an introduction instead of an onboarding summary when onboarding is %s", async (status) => {
    const onPrompt = vi.fn();
    renderWithProviders(<SeedUser profile={{ ...mockUser, onboarding_status: status }} onPrompt={onPrompt} />, { auth: true });
    expect(screen.queryByRole("button", { name: "What do you know about me so far?" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Ask me a question to get to know me" }));
    expect(onPrompt).toHaveBeenCalledWith("Ask me one simple question to get to know me. Let's start with what matters to me right now.");
  });
});
