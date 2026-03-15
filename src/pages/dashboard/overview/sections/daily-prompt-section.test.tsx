import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import DailyPromptSection from "./daily-prompt-section";

describe("DailyPromptSection", () => {
  it("renders single card with prompt text and action buttons", async () => {
    renderWithProviders(<DailyPromptSection />, {
      route: "/overview",
      auth: true,
    });

    await screen.findByText(
      /Think of a recent happy memory with your family/i,
    );
    expect(screen.getByRole("link", { name: /Write a response/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Speak it/i })).toBeInTheDocument();
  });

  it("shows prompt tabs when multiple prompts exist", async () => {
    renderWithProviders(<DailyPromptSection />, {
      route: "/overview",
      auth: true,
    });

    await screen.findByText(/Prompt 1/i);
    expect(screen.getByRole("button", { name: /Prompt 1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Prompt 2/i })).toBeInTheDocument();
  });

  it("switches prompt when tab is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DailyPromptSection />, {
      route: "/overview",
      auth: true,
    });

    await screen.findByText(/Think of a recent happy memory/i);
    await user.click(screen.getByRole("button", { name: /Prompt 2/i }));

    expect(screen.getByText(/grateful for today/i)).toBeInTheDocument();
  });
});
