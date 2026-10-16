import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import {
  ConversationChromeProvider,
  useConversationChrome,
} from "@/contexts/conversation-chrome";
import { ChatSidebarProvider } from "@/contexts/chat-sidebar";
import { useStore } from "@/hooks/use-store";
import { DashboardHeader } from "./dashboard-header";
import type { IMemory } from "@/utility/interface";

const noop = () => {};

function DashboardHeaderWithConversationChrome({
  memory,
  onOpenSettings = noop,
}: {
  memory: Partial<IMemory> & { _id: string; title: string };
  onOpenSettings?: () => void;
}) {
  const { setChrome } = useConversationChrome();
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setChrome({
      memory: memory as IMemory,
      onOpenChatPreferences: onOpenSettings,
      spokenReplies: { enabled, supported: true, onToggle: () => setEnabled(value => !value) },
      hostChat: {
        title: "Chat",
        subtitle: "Active since Mar 29, 2026",
        onSearch: () => {},
      },
    });
    return () => setChrome(null);
  }, [memory, setChrome, enabled, onOpenSettings]);
  return <DashboardHeader />;
}

function DashboardHeaderWithTitle({ title }: { title: string }) {
  const { setHeaderTitle } = useStore();

  useEffect(() => {
    setHeaderTitle?.(title);
    return () => setHeaderTitle?.("");
  }, [setHeaderTitle, title]);

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
      screen.getByRole("button", { name: "Choose theme" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Quick tools" })).toBeVisible();
  });

  it("renders the original inline SVG icons and switches their colours with the theme", async () => {
    const user = userEvent.setup();
    renderDashboardHeader(<DashboardHeader />);
    const themeButton = screen.getByRole("button", { name: "Choose theme" });
    const toolsButton = screen.getByRole("button", { name: "Quick tools" });
    const originalToolsFill = toolsButton.querySelector("svg path")?.getAttribute("fill");
    expect(themeButton.querySelector("svg path")).not.toBeNull();
    expect(toolsButton.querySelector("svg path")).not.toBeNull();
    expect(screen.getByRole("img", { name: "Streak" }).tagName.toLowerCase()).toBe("svg");
    expect(screen.getByRole("img", { name: "Streak" }).querySelector("linearGradient")).not.toBeNull();
    expect(themeButton.querySelector("img")).toBeNull();
    expect(toolsButton.querySelector("img")).toBeNull();
    await user.click(themeButton);
    await user.click(screen.getByRole("menuitemradio", { name: "Dark", exact: true }));
    expect(toolsButton.querySelector("svg path")?.getAttribute("fill")).not.toBe(originalToolsFill);
    expect(themeButton).toHaveClass("size-10", "rounded-full");
  });

  it("shows the streak control in the default header", () => {
    const { container } = renderDashboardHeader(<DashboardHeader />);

    expect(screen.getByRole("img", { name: "Streak" })).toBeTruthy();

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

  it("uses the overview navigation on nested Explore routes and keeps the page title", () => {
    const { container } = renderDashboardHeader(
      <DashboardHeaderWithTitle title="Explore topics" />,
      { route: "/explore/categories/growing-up" },
    );

    expect(screen.getByText("Explore topics")).toBeInTheDocument();
    expect(container.querySelector("header")?.parentElement).toHaveClass("sm:h-[76px]");
    expect(container.querySelector("header")?.parentElement).not.toHaveClass("border-b");
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
      "size-10",
      "rounded-full",
      "bg-fill-neutral-weak",
    );
    expect(
      screen.getByRole("button", { name: "Choose theme" }),
    ).toHaveClass("size-10", "rounded-full");
    const streakIcon = screen.getByRole("img", { name: "Streak" });
    expect(streakIcon).toHaveClass("size-5");
    expect(streakIcon.parentElement).toHaveClass(
      "size-10",
      "rounded-full",
    );
    expect(streakIcon.parentElement).toHaveTextContent("0");
  });

  it("uses the overview navigation on other non-Chat dashboard routes", () => {
    const { container } = renderDashboardHeader(<DashboardHeader />, {
      route: "/settings/general",
    });

    expect(screen.getByText("settings")).toBeInTheDocument();
    expect(container.querySelector("header")?.parentElement).toHaveClass("sm:h-[76px]");
    expect(container.querySelector("header")?.parentElement).not.toHaveClass("border-b");
    expect(screen.getByRole("button", { name: "Open search" })).toHaveClass(
      "h-9",
      "bg-fill-neutral-weak",
    );
  });

  it("keeps the non-overview navigation on Chat routes", () => {
    const { container } = renderDashboardHeader(<DashboardHeader />, {
      route: "/chat",
    });

    expect(screen.getByText("chat with AI")).toBeInTheDocument();
    expect(container.querySelector("header")?.parentElement).toHaveClass("border-b");
    expect(container.querySelector("header")?.parentElement).not.toHaveClass("sm:h-[76px]");
    expect(screen.getByRole("button", { name: "Open search" })).toHaveClass(
      "h-10",
    );
    expect(
      screen
        .getByRole("button", { name: "Open search" })
        .querySelector('[data-slot="search-command-shortcut"]'),
    ).toBeInTheDocument();
  });

  it("removes the navigation search field on the stories page", () => {
    renderDashboardHeader(<DashboardHeader />, { route: "/stories" });

    expect(
      screen.queryByRole("button", { name: "Open search" }),
    ).not.toBeInTheDocument();
  });

  it("uses semantic surfaces and foregrounds in the default header", () => {
    const { container } = renderDashboardHeader(<DashboardHeader />);
    const shell = container.querySelector("header")?.parentElement;
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
    expect(screen.getByRole("img", { name: "Streak" })).toBeTruthy();
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

    expect(screen.getByRole("button", { name: "Quick tools" })).toHaveClass("size-10", "rounded-full", "bg-fill-neutral-weak");
    expect(screen.getByRole("button", { name: "Quick tools" }).querySelector("svg path")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Choose theme" })).toHaveClass("size-10", "rounded-full", "bg-fill-neutral-weak");
    expect(screen.getByRole("button", { name: "Choose theme" }).querySelector("svg path")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Chat settings" })).toHaveClass("size-10", "rounded-full", "bg-fill-neutral-weak");
    expect(screen.getByRole("button", { name: "Read AI replies aloud" })).toHaveClass("size-10", "rounded-full", "bg-fill-neutral-weak");
    expect(screen.queryByRole("img", { name: "Streak" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /search memories/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/active since mar 29, 2026/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /read ai replies aloud/i }),
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

  it("toggles spoken replies independently of the far-right settings button", async () => {
    const user = userEvent.setup();
    const onOpenSettings = vi.fn();
    renderDashboardHeader(<DashboardHeaderWithConversationChrome memory={{ _id: "m1", title: "Test" }} onOpenSettings={onOpenSettings} />, { route: "/chat/m1" });
    const audio = screen.getByRole("button", { name: "Read AI replies aloud" });
    expect(audio).toHaveAttribute("aria-pressed", "false");
    await user.click(audio);
    expect(audio).toHaveAttribute("aria-pressed", "true");
    expect(audio).toHaveClass("bg-fill-neutral-weak", "text-text-brand-strong");
    expect(onOpenSettings).not.toHaveBeenCalled();
    await user.click(audio);
    expect(audio).toHaveAttribute("aria-pressed", "false");
    const settings = screen.getByRole("button", { name: "Chat settings" });
    expect(settings.parentElement?.lastElementChild).toBe(settings);
    await user.click(settings);
    expect(onOpenSettings).toHaveBeenCalledOnce();
  });

  it("uses semantic surfaces and foregrounds in the conversation header", () => {
    const { container } = renderDashboardHeader(
      <DashboardHeaderWithConversationChrome
        memory={{ _id: "m1", title: "Test thread", bookmarked: false }}
      />,
      { route: "/chat/m1" },
    );

    const shell = container.querySelector("header")?.parentElement;
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
