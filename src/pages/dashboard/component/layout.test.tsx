import { screen } from "@testing-library/react";
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
  DashboardHeader: () => <div data-testid="dashboard-header" />,
}));

vi.mock("./dashboard-sidebar", () => ({
  DashboardSideBar: () => <div data-testid="dashboard-sidebar" />,
}));

vi.mock("./dashboard-chat-sidebar", () => ({
  DashboardChatSidebar: () => <div data-testid="dashboard-chat-sidebar" />,
}));

vi.mock("@/features/onboarding-groot", () => ({
  OnboardingNudgeBanner: () => <div role="banner">Nudge</div>,
}));

import DashboardLayout from "./layout";

describe("DashboardLayout", () => {
  it("wraps onboarding nudge in a compact flex column with centered items", () => {
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

    const nudgeHost = screen.getByRole("banner").parentElement;
    expect(nudgeHost?.className).toMatch(/\bflex\b/);
    expect(nudgeHost?.className).toMatch(/\bflex-col\b/);
    expect(nudgeHost?.className).toMatch(/\bitems-center\b/);
    expect(nudgeHost?.className).toMatch(/\bjustify-start\b/);
    expect(nudgeHost?.className).toMatch(/\bpy-1\b/);
    expect(container.querySelector('[data-testid="outlet-child"]')).toBeTruthy();
  });
});
