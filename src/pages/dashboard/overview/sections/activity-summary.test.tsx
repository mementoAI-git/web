import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import ActivitySummary from "./activity-summary";

describe("ActivitySummary", () => {
  it("renders Continue reflecting and Recent Activities headings in separate layout blocks", async () => {
    renderWithProviders(<ActivitySummary />, { route: "/overview", auth: true });

    expect(
      screen.getByRole("heading", { name: /continue reflecting/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: /recent activities/i }),
    ).toBeInTheDocument();
  });
});
