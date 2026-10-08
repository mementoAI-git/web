import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router-dom";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test";

import { TrialBanner } from "./trial-banner";

vi.mock("@/contexts/subscription", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/contexts/subscription")>();
  return {
    ...actual,
    useSubscription: () => ({
      summary: null,
      usage: undefined,
      tier: null,
      status: "trialing" as const,
      trialEndsAt: new Date(Date.now() + 5 * 86400000).toISOString(),
      isLoading: false,
      error: null,
      isPro: false,
      isLegacy: false,
      isProOrAbove: false,
      canAccess: () => false,
      refresh: vi.fn(),
    }),
  };
});

describe("TrialBanner", () => {
  it("shows trial copy and upgrade link", () => {
    renderWithProviders(<TrialBanner />, { route: "/overview", auth: true });

    expect(screen.getByRole("status")).toHaveTextContent(/trial/i);
    expect(screen.getByRole("link", { name: /upgrade now/i })).toHaveAttribute("href", "/pricing");
  });
  it("carries the complete originating URL into pricing", async () => {
    function Origin() { return <output data-testid="pricing-origin">{useLocation().state?.returnTo}</output>; }
    renderWithProviders(<><TrialBanner /><Origin /></>, { route: "/stories?tab=bookmarked#saved", auth: true });
    await userEvent.click(screen.getByRole("link", { name: /upgrade now/i }));
    expect(screen.getByTestId("pricing-origin")).toHaveTextContent("/stories?tab=bookmarked#saved");
  });

});
