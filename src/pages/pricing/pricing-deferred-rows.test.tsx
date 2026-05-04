import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";

import { renderWithProviders } from "@/test";

import PricingPage from "./index";

const PRD_TOOLTIP = "This feature is on our roadmap and coming soon.";

describe("PricingPage deferred roadmap (PRD §3.5)", () => {
  it("uses exact PRD tooltip on deferred rows and keeps rows non-interactive", () => {
    renderWithProviders(<PricingPage />, { route: "/pricing", auth: true });

    const roadmap = screen.getByRole("region", { name: /on the roadmap/i });
    const rows = within(roadmap).getAllByTitle(PRD_TOOLTIP);
    expect(rows.length).toBeGreaterThan(0);

    for (const el of rows) {
      expect(el).toHaveClass("pointer-events-none");
    }
  });
});
