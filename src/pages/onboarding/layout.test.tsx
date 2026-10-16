import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "@/test";
import OnboardLayout from "./layout";
vi.mock("@/components/layouts/auth-check", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

describe("OnboardLayout", () => {
  it("centres the wordmark with no header skip on welcome", () => {
    renderWithProviders(
      <Routes>
        <Route path="/onboarding" element={<OnboardLayout />}>
          <Route path="welcome" element={<div>Welcome</div>} />
        </Route>
      </Routes>,
      { route: "/onboarding/welcome", auth: true },
    );
    expect(screen.getByRole("link", { name: "Memento." })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Skip" }),
    ).not.toBeInTheDocument();
  });
  it("shows Skip on summary and sends the user to the dashboard", async () => {
    server.use(http.post("*/users/onboarding/skip", () => HttpResponse.json({ success: true })));
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/onboarding" element={<OnboardLayout />}>
          <Route path="summary" element={<div>Summary</div>} />
        </Route>
        <Route path="/overview" element={<div>Dashboard</div>} />
      </Routes>,
      { route: "/onboarding/summary", auth: true },
    );
    await user.click(screen.getByRole("button", { name: "Skip" }));
    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
  });
});
