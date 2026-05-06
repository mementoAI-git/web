import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import DailyPromptSection from "./daily-prompt-section";

describe("DailyPromptSection", () => {
  it("renders AI prompt first with the capture action", async () => {
    renderWithProviders(<DailyPromptSection />, {
      route: "/overview",
      auth: true,
    });

    await screen.findByText(/unfinished when you think about it/i);
    expect(screen.getByRole("button", { name: /Write or speak it/i })).toBeInTheDocument();
  });

  it("shows tabs for AI label and static prompts", async () => {
    renderWithProviders(<DailyPromptSection />, {
      route: "/overview",
      auth: true,
    });

    await screen.findByRole("radio", { name: /Just for you/i });
    expect(screen.getByRole("radio", { name: /Just for you/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Prompt 2/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Prompt 3/i })).toBeInTheDocument();
  });

  it("switches prompt when tab is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DailyPromptSection />, {
      route: "/overview",
      auth: true,
    });

    await screen.findByText(/unfinished when you think about it/i);
    await user.click(screen.getByRole("radio", { name: /Prompt 2/i }));

    expect(
      screen.getByText(/Think of a recent happy memory with your family/i),
    ).toBeInTheDocument();
  });
});
