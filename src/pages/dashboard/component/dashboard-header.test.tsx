import type { ReactElement } from "react";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test";
import { ConversationChromeProvider } from "@/contexts/conversation-chrome";
import { ChatSidebarProvider } from "@/contexts/chat-sidebar";
import { DashboardHeader } from "./dashboard-header";

function renderDashboardHeader(ui: ReactElement, options?: { route?: string }) {
  return renderWithProviders(
    <ChatSidebarProvider>
      <ConversationChromeProvider>{ui}</ConversationChromeProvider>
    </ChatSidebarProvider>,
    { route: "/overview", auth: true, ...options },
  );
}

describe("DashboardHeader", () => {
  it("shows the streak control in the default header", () => {
    const { container } = renderDashboardHeader(<DashboardHeader />);

    expect(screen.getByAltText("Streak")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /open chat/i }),
    ).toBeInTheDocument();

    const searchTrigger = container.querySelector('[aria-label="Open search"]');
    expect(searchTrigger).not.toBeNull();
    expect(searchTrigger?.className).toMatch(/rounded-lg/);
    const searchColumn = searchTrigger?.parentElement;
    expect(searchColumn?.className).toMatch(/max-w-\[700px\]/);
    expect(searchColumn?.className).toMatch(/min-w-\[min\(100%,280px\)\]/);
  });

  it("resolves the dashboard title for /capsule like other sections", () => {
    renderDashboardHeader(<DashboardHeader />, { route: "/capsule" });

    expect(screen.getByText(/time capsule/i)).toBeTruthy();
    expect(screen.getByAltText("Streak")).toBeTruthy();
  });
});
