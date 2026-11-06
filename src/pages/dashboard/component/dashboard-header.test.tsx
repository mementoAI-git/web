import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import { DashboardOverlayFrame } from "./dashboard-overlay-frame";
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
  it("uses the chat navigation for topic replies", async () => {
    const user = userEvent.setup();
    const onOpenSettings = vi.fn();
    renderDashboardHeader(
      <DashboardHeaderWithConversationChrome memory={{ _id: "topic-conversation", title: "A topic reply" }} onOpenSettings={onOpenSettings} />,
      { route: "/chat/reply/topic-1" },
    );
    expect(screen.getByRole("heading", { name: "Chat" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search memories" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Streak:/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Read AI replies aloud" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Chat settings" }));
    expect(onOpenSettings).toHaveBeenCalledOnce();
  });

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
    expect(searchTrigger).toHaveClass("size-10", "rounded-full");
    expect(searchTrigger?.querySelector("svg")).not.toBeNull();
  });

  it("uses the overview navigation on nested Explore routes and keeps the page title", () => {
    const { container } = renderDashboardHeader(
      <DashboardHeaderWithTitle title="Explore topics" />,
      { route: "/explore/categories/growing-up" },
    );

    expect(screen.getByText("Explore topics")).toBeInTheDocument();
    expect(container.querySelector(".dashboard-header-surface")).toHaveClass("sm:h-[76px]");
    expect(container.querySelector(".dashboard-header-surface")).not.toHaveClass("border-b");
    expect(screen.getByRole("button", { name: "Open search" })).toHaveClass("size-10", "rounded-full");
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
    expect(container.querySelector(".dashboard-header-surface")).toHaveClass("sm:h-[76px]");
    expect(container.querySelector(".dashboard-header-surface")).not.toHaveClass("border-b");
    expect(screen.getByRole("button", { name: "Open search" })).toHaveClass("size-10", "rounded-full");
  });

  it("places the workspace switcher in the Chat header", () => {
    const { container } = renderDashboardHeader(<DashboardHeader />, {
      route: "/chat",
    });

    expect(screen.getByRole("button", { name: "Change Memento" })).toBeInTheDocument();
    expect(container.querySelector(".dashboard-header-surface")).toHaveClass("sm:h-[86px]");
    expect(container.querySelector(".dashboard-header-surface")).not.toHaveClass("sm:h-[76px]");
    expect(screen.getByRole("button", { name: "Open search" })).toHaveClass("size-10", "rounded-full");
    expect(
      screen
        .getByRole("button", { name: "Open search" })
        .querySelector('[data-slot="search-command-shortcut"]'),
    ).not.toBeInTheDocument();
  });

  it("removes the navigation search field on the stories page", () => {
    renderDashboardHeader(<DashboardHeader />, { route: "/stories" });

    expect(
      screen.queryByRole("button", { name: "Open search" }),
    ).not.toBeInTheDocument();
  });

  it("uses semantic surfaces and foregrounds in the default header", () => {
    const { container } = renderDashboardHeader(<DashboardHeader />);
    const shell = container.querySelector(".dashboard-header-surface");
    expect(shell).toHaveClass("sm:h-[76px]");
    expect(shell).not.toHaveClass("bg-background");
    expect(shell?.querySelector(".dashboard-header-blur")).toHaveAttribute("aria-hidden", "true");
    expect(shell).not.toHaveClass("bg-card");
    expect(shell).not.toHaveClass("bg-white");
    expect(screen.getByText("overview")).toHaveClass("text-foreground");
    expect(screen.getByRole("button", { name: "Open search" })).toHaveClass("bg-fill-neutral-weak");
  });

  it("opens the side menu from the home button on phones", async () => {
    const onMainSidebarToggle = vi.fn();
    renderDashboardHeader(<DashboardHeader onMainSidebarToggle={onMainSidebarToggle} />);

    const home = screen.getByRole("button", { name: "Expand sidebar" });
    expect(home).toHaveClass("sidebar-reopen-button", "md:hidden");
    expect(home).not.toHaveClass("hidden");
    expect(screen.queryByRole("button", { name: "Open sidebar" })).not.toBeInTheDocument();
    await userEvent.setup().click(home);
    expect(onMainSidebarToggle).toHaveBeenCalledOnce();
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
    expect(screen.queryByRole("img", { name: "Streak" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /search memories/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change Memento" })).toBeInTheDocument();
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

  it("opens chat settings from the header, where narration now lives", async () => {
    const user = userEvent.setup();
    const onOpenSettings = vi.fn();
    renderDashboardHeader(<DashboardHeaderWithConversationChrome memory={null} onOpenSettings={onOpenSettings} />, { route: "/chat/new" });
    expect(screen.queryByRole("button", { name: "Read AI replies aloud" })).not.toBeInTheDocument();
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

    const shell = container.querySelector(".dashboard-header-surface");
    expect(shell).toHaveClass("sm:h-[86px]");
    expect(shell).not.toHaveClass("bg-background");
    expect(shell?.querySelector(".dashboard-header-blur")).toHaveAttribute("aria-hidden", "true");
    expect(shell).not.toHaveClass("bg-card");
    expect(shell).not.toHaveClass("bg-white");
    expect(screen.getByRole("button", { name: "Change Memento" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /(?:expand|collapse) sidebar/i }),
    ).not.toBeInTheDocument();
  });
});

it("uses a home icon for the collapsed sidebar and preserves its toggle action", async () => {
  const toggle = vi.fn();
  const user = userEvent.setup();
  renderDashboardHeader(<DashboardHeader mainSidebarCollapsed onMainSidebarToggle={toggle} />);
  const button = screen.getByRole("button", { name: "Expand sidebar" });
  expect(button).toHaveAttribute("aria-expanded", "false");
  expect(button).toHaveClass("sidebar-reopen-button");
  expect(button.querySelector(".t-icon-swap")).toHaveAttribute("data-state", "a");
  expect(button.querySelector('[data-icon="a"] svg')).toHaveClass("lucide-house");
  await user.click(button);
  expect(toggle).toHaveBeenCalledOnce();
});


it("brings back the sidebar from Home on full-screen pages instead of leaving them", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  renderDashboardHeader(
    <DashboardOverlayFrame>
      <DashboardHeader
        overlay={{
          title: <h1>Settings</h1>,
          searchLabel: "Search",
          closeLabel: "Close",
          onSearch: vi.fn(),
          onClose,
        }}
      />
    </DashboardOverlayFrame>,
  );
  const home = screen.getByRole("button", { name: "Expand sidebar" });
  await user.click(home);
  expect(home).toHaveAttribute("aria-expanded", "true");
  expect(onClose).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
  expect(home).toHaveAttribute("aria-expanded", "false");
  expect(home).toHaveFocus();
  expect(onClose).not.toHaveBeenCalled();
});

it("reuses dashboard controls in a full-screen overlay without page navigation", async () => {
  const user = userEvent.setup();
  const onSearch = vi.fn();
  const onClose = vi.fn();
  renderDashboardHeader(<DashboardHeader overlay={{ title: <h2>My insights</h2>, searchLabel: "Search insights", closeLabel: "Close insights", onSearch, onClose }} />);
  expect(screen.getByRole("heading", { name: "My insights" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Quick tools" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Choose theme" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Search insights" }));
  expect(onSearch).toHaveBeenCalledOnce();
  await user.keyboard("{Control>}k{/Control}");
  expect(onSearch).toHaveBeenCalledTimes(2);
  await user.click(screen.getByRole("button", { name: "Close insights" }));
  expect(onClose).toHaveBeenCalledOnce();
});
