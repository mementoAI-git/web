import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CreateMemoryAssistantComingSoonPanel } from "./create-memory-assistant-coming-soon-panel";
import { renderWithProviders } from "@/test";

describe("CreateMemoryAssistantComingSoonPanel", () => {
  it("renders the coming soon assistant state copy", () => {
    renderWithProviders(<CreateMemoryAssistantComingSoonPanel />, { auth: true });

    expect(screen.getByText(/assistant coming soon!/i)).toBeInTheDocument();
    expect(
      screen.getByText(/assistant will help you with writing your journals/i),
    ).toBeInTheDocument();
  });
});
