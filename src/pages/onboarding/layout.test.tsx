import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "@/test";
import OnboardLayout from "./layout";

vi.mock("@/components/layouts/auth-check", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-check">{children}</div>,
}));

describe("OnboardLayout", () => {
  it("uses v3 fill token for skip control hover color", () => {
    renderWithProviders(
      <Routes>
        <Route path="/onboarding" element={<OnboardLayout />}>
          <Route index element={<div>Child</div>} />
        </Route>
      </Routes>,
      { route: "/onboarding", auth: true },
    );

    const skip = screen.getByRole("button", { name: /skip for now/i });
    expect(skip).toHaveClass("hover:text-v3-fill-strong");
  });

  it("does not render the skip control on the summary route", () => {
    renderWithProviders(
      <Routes>
        <Route path="/onboarding" element={<OnboardLayout />}>
          <Route path="summary" element={<div>Summary</div>} />
        </Route>
      </Routes>,
      { route: "/onboarding/summary", auth: true },
    );

    expect(
      screen.queryByRole("button", { name: /skip for now/i }),
    ).not.toBeInTheDocument();
  });
});
