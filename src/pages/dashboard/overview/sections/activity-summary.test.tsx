import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import ActivitySummary from "./activity-summary";

describe("ActivitySummary", () => {
  it("shows recent stories alongside reflection prompts", async () => {
    renderWithProviders(<ActivitySummary />, {
      route: "/overview",
      auth: true,
    });

    expect(
      screen.getByRole("heading", { name: /continue reflecting/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: /recent stories/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /recent activities/i }),
    ).not.toBeInTheDocument();
  });
});
