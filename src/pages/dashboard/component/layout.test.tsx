import { fireEvent, screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { renderWithProviders } from "@/test";
import { ChatSidebarProvider } from "@/contexts/chat-sidebar";

vi.mock("@/components/layouts/auth-check", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/layouts/onboarding-guard", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/modal", () => ({
  default: () => null,
}));

vi.mock("./dashboard-header", () => ({
  DashboardHeader: ({ onMenuClick }: { onMenuClick: () => void }) => <button data-sidebar-toggle="" data-testid="dashboard-header" onClick={onMenuClick}>Open sidebar</button>,
}));

vi.mock("./dashboard-sidebar", () => ({
  DashboardSideBar: ({ onCollapse, compact }: { onCollapse: () => void; compact?: boolean }) => <div data-testid="dashboard-sidebar" data-compact={compact}><button onClick={onCollapse}>Close sidebar</button></div>,
}));

vi.mock("./dashboard-chat-sidebar", () => ({
  DashboardChatSidebar: () => <div data-testid="dashboard-chat-sidebar" />,
}));

vi.mock("@/features/onboarding-groot", () => ({
  OnboardingNudgeBanner: () => <div role="banner">Nudge</div>,
}));

import DashboardLayout from "./layout";

describe("DashboardLayout", () => {
  it.each([["/chat/people", false], ["/overview", false], ["/stories", false]])("keeps the full sidebar on %s", (route, compact) => {
    renderWithProviders(<ChatSidebarProvider><DashboardLayout /></ChatSidebarProvider>, {route, auth: true});
    expect(screen.getByTestId("dashboard-sidebar")).toHaveAttribute("data-compact", String(compact));
  });
  it("removes the closed mobile sidebar from keyboard navigation", () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    try {
      renderWithProviders(
        <ChatSidebarProvider><DashboardLayout /></ChatSidebarProvider>,
        { route: "/overview", auth: true },
      );
      const sidebar = screen.getByTestId("dashboard-sidebar").parentElement!;
      expect(sidebar).toHaveAttribute("inert");
      fireEvent.click(screen.getByRole("button", { name: "Open sidebar" }));
      expect(sidebar).not.toHaveAttribute("inert");
      const closeButton = screen.getByRole("button", { name: "Close sidebar" });
      closeButton.focus();
      fireEvent.click(closeButton);
      expect(sidebar).toHaveAttribute("inert");
      expect(screen.getByRole("button", { name: "Open sidebar" })).toHaveFocus();
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
    }
  });


  it.each([
    ["/overview", true],
    ["/chat/new", true],
    ["/settings/security", true],
    ["/settings/beneficiary", false],
    ["/stories", false],
  ])("scopes sky cards on %s: %s", (route, scoped) => {
    renderWithProviders(
      <ChatSidebarProvider>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="*" element={<div data-testid="scoped-outlet" />} />
          </Route>
        </Routes>
      </ChatSidebarProvider>,
      { route, auth: true },
    );
    expect(Boolean(screen.getByTestId("scoped-outlet").closest("[data-sky-card-page]"))).toBe(scoped);
  });

  it("renders nudge banners above the scrollable outlet column", () => {
    const { container } = renderWithProviders(
      <ChatSidebarProvider>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<div data-testid="outlet-child" />} />
          </Route>
        </Routes>
      </ChatSidebarProvider>,
      { route: "/", auth: true },
    );

    expect(screen.getByRole("banner")).toBeInTheDocument();
    const outlet = screen.getByTestId("outlet-child");
    expect(outlet.parentElement?.className).toMatch(/\bh-full\b/);
    expect(outlet.parentElement?.className).toMatch(/\bmin-h-0\b/);
    expect(outlet.parentElement?.className).toMatch(/\bw-full\b/);
    expect(outlet.parentElement?.className).toMatch(/\boverflow-y-auto\b/);
    expect(container.querySelector('[data-testid="outlet-child"]')).toBeTruthy();
  });
});
