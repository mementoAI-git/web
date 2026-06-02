import type { ReactElement } from "react";
import { useEffect } from "react";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test";
import { ConversationChromeProvider, useConversationChrome } from "@/contexts/conversation-chrome";
import { ChatSidebarProvider } from "@/contexts/chat-sidebar";
import { DashboardHeader } from "./dashboard-header";
import type { IMemory } from "@/utility/interface";

function DashboardHeaderWithConversationChrome({
  memory,
}: {
  memory: Partial<IMemory> & { _id: string; title: string };
}) {
  const { setChrome } = useConversationChrome();
  useEffect(() => {
    setChrome({
      memory: memory as IMemory,
      onViewDetails: () => {},
      onOpenChatPreferences: () => {},
    });
    return () => setChrome(null);
  }, [memory, setChrome]);
  return <DashboardHeader />;
}

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

    const searchTrigger = container.querySelector('[aria-label="Open search"]');
    expect(searchTrigger).not.toBeNull();
    expect(searchTrigger?.className).toMatch(/rounded-lg/);
    const searchColumn = searchTrigger?.parentElement;
    expect(searchColumn?.className).toMatch(/min-w-0/);
    expect(searchColumn?.className).toMatch(/justify-self-center/);
  });

  it("resolves the dashboard title for /capsule like other sections", () => {
    renderDashboardHeader(<DashboardHeader />, { route: "/capsule" });

    expect(screen.getByText(/time capsules/i)).toBeTruthy();
    expect(screen.getByAltText("Streak")).toBeTruthy();
  });

  it("shows Chat settings on the right in conversation top nav", () => {
    renderWithProviders(
      <ChatSidebarProvider>
        <ConversationChromeProvider>
          <DashboardHeaderWithConversationChrome
            memory={{ _id: "m1", title: "Test thread", bookmarked: false }}
          />
        </ConversationChromeProvider>
      </ChatSidebarProvider>,
      { route: "/chat/m1", auth: true },
    );

    expect(
      screen.getByRole("button", { name: /chat settings/i }),
    ).toBeInTheDocument();
  });
});
