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
