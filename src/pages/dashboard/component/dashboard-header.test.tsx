import type { ReactElement } from "react";
import { useEffect } from "react";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test";
import {
  ConversationChromeProvider,
  useConversationChrome,
} from "@/contexts/conversation-chrome";
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
      onOpenChatPreferences: () => {},
      hostChat: {
        title: "Chat",
        subtitle: "Active since Mar 29, 2026",
        onSearch: () => {},
      },
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
  it("exposes theme options in the top navigation", () => {
    renderDashboardHeader(<DashboardHeader />);
    expect(
      screen.getByRole("button", { name: /switch to (light|dark) mode/i }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Quick tools" })).toBeVisible();
  });

  it("shows the streak control in the default header", () => {
    const { container } = renderDashboardHeader(<DashboardHeader />);

    expect(screen.getByAltText("Streak")).toBeTruthy();

    const searchTrigger = container.querySelector('[aria-label="Open search"]');
    expect(searchTrigger).not.toBeNull();
    expect(searchTrigger?.className).toMatch(/rounded-lg/);
    const searchColumn = searchTrigger?.parentElement;
    expect(searchColumn?.className).toMatch(/min-w-0/);
    expect(searchColumn?.className).toMatch(/justify-self-center/);
    expect(
      searchTrigger?.querySelector('[data-slot="search-command-shortcut"]'),
    ).not.toBeInTheDocument();
  });

  it("uses the overview navigation controls on Explore", () => {
    const { container } = renderDashboardHeader(<DashboardHeader />, {
      route: "/explore",
    });
    expect(screen.getByText("explore")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass("sm:h-[76px]");
    expect(screen.getByRole("button", { name: "Open search" })).toHaveClass(
      "h-9",
      "bg-fill-neutral-weak",
    );
    expect(
      screen
        .getByRole("button", { name: "Open search" })
        .querySelector('[data-slot="search-command-shortcut"]'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quick tools" })).toHaveClass(
      "h-8",
      "w-[52px]",
      "bg-fill-neutral-weak",
    );
    expect(
      screen.getByRole("button", { name: /switch to (light|dark) mode/i }),
    ).toHaveClass("h-8", "w-[52px]");
    expect(screen.getByAltText("Streak")).toHaveClass("size-5");
  });

  it("removes the navigation search field on the stories page", () => {
    renderDashboardHeader(<DashboardHeader />, { route: "/stories" });

    expect(
      screen.queryByRole("button", { name: "Open search" }),
    ).not.toBeInTheDocument();
  });

  it("uses semantic surfaces and foregrounds in the default header", () => {
    const { container } = renderDashboardHeader(<DashboardHeader />);
    const shell = container.firstElementChild;
    expect(shell).toHaveClass("bg-background", "sm:h-[76px]");
    expect(shell).not.toHaveClass("bg-card");
    expect(shell).not.toHaveClass("bg-white");
    expect(screen.getByText("overview")).toHaveClass("text-foreground");
    expect(screen.getByRole("button", { name: "Open search" })).toHaveClass(
      "bg-fill-neutral-weak",
      "border-border",
    );
  });

  it("keeps the mobile menu control readable", () => {
    renderDashboardHeader(<DashboardHeader />);

    expect(screen.getByRole("button", { name: "Open sidebar" })).toHaveClass(
      "text-muted-foreground",
      "hover:bg-muted",
    );
  });

  it("resolves the dashboard title for /capsule like other sections", () => {
    renderDashboardHeader(<DashboardHeader />, { route: "/capsule" });

    expect(screen.getByText(/time capsules/i)).toBeTruthy();
    expect(screen.getByAltText("Streak")).toBeTruthy();
  });

  it("shows the conversation actions for a normal chat route", () => {
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

    expect(screen.queryByRole("button", { name: "Quick tools" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /search memories/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/active since mar 29, 2026/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /audio settings/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /voice mode/i })).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /chat settings/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /share conversation/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /open memory sidebar/i }),
    ).not.toBeInTheDocument();
  });

  it("uses semantic surfaces and foregrounds in the conversation header", () => {
    const { container } = renderDashboardHeader(
      <DashboardHeaderWithConversationChrome
        memory={{ _id: "m1", title: "Test thread", bookmarked: false }}
      />,
      { route: "/chat/m1" },
    );

    const shell = container.firstElementChild;
    expect(shell).toHaveClass("bg-background", "sm:h-[76px]");
    expect(shell).not.toHaveClass("bg-card");
    expect(shell).not.toHaveClass("bg-white");
    expect(screen.getByRole("heading", { name: "Chat" })).toHaveClass(
      "text-foreground",
    );
    expect(
      screen.queryByRole("button", { name: /(?:expand|collapse) sidebar/i }),
    ).not.toBeInTheDocument();
  });
});
