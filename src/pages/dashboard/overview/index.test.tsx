import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import OverviewPage from "./index";

describe("OverviewPage", () => {
  it("renders stacked overview sections", async () => {
    const { container } = renderWithProviders(<OverviewPage />, {
      route: "/overview",
      auth: true,
    });

    const wrapper = container.querySelector('[class*="964px"]');
    expect(wrapper).toHaveClass("flex", "flex-col", "gap-10");

    expect(
      await screen.findByRole("heading", { name: /continue reflecting/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /explore more topics/i }),
    ).toBeInTheDocument();
  });
});
