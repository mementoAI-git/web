import { dashboardInset } from "./dashboard-inset";
import { ChatSwitcher } from "../chat/chat-switcher";
import { Spinner } from "@/components/ui/spinner";
import "@/components/motion/icon-swap.css";
import { OverviewDesignIcon } from "@/components/overview-design-icon";
import { QuickTools } from "@/components/quick-tools";
import { ThemeSwitcher } from "@/components/theme-switcher";
import zapIcon from "@/assets/icon/zap.svg";
import {
  ChevronLeft,
  PanelLeft,
  House,
  VolumeX,
  Volume2,
  MoreHorizontal,
  X,
} from "lucide-react";
import dayjs from "dayjs";
import { useEffect, useState, type ReactNode } from "react";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import StreakTracker from "@/components/streak-tracker";
import { Link, useLocation, useMatch } from "react-router-dom";
import { cn } from "@/utility";
import { MenuIcon } from "@/components/icons";
import { SearchIcon as IconSearch } from "@/components/icons";
import { useConversationChrome } from "@/contexts/conversation-chrome";
import { useDashboardHeaderActions } from "@/contexts/dashboard-header-actions";
import { StoriesActionButtons } from "@/pages/dashboard/stories/components/stories-action-buttons";
import { Button } from "@/components/ui/button";
import { useOverlaySidebar } from "./dashboard-overlay-frame";
import { SearchCommandShortcut } from "@/components/search-command-shortcut";

const defaultHeaderTitle: Record<string, string> = {
  memories: "my memories",
  stories: "my stories",
  chat: "Chat",
  explore: "explore",
  overview: "overview",
  settings: "settings",
  people: "people",
  capsule: "time capsules",
  "time-capsule": "time capsules",
  "": "overview",
};

const truncateText = (text: string, maxLength = 32): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

function useMdViewport() {
  const [mdUp, setMdUp] = useState(false);
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setMdUp(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return mdUp;
}

interface DashboardHeaderProps {
  /** Full-screen overlays reuse the dashboard navigation controls. */
  overlay?: {
    title: ReactNode;
    searchLabel: string;
    closeLabel: string;
    searchExpanded?: boolean;
    /** Adds the theme switcher and streak to the overlay's controls. */
    showAccountControls?: boolean;
    onSearch: () => void;
    onClose: () => void;
  };
  onMenuClick?: () => void;
  /** Mobile drawer open (main left nav) */
  mobileSidebarOpen?: boolean;
  /** Desktop: main left nav width collapsed */
  mainSidebarCollapsed?: boolean;
  /** Toggle main left nav (drawer on mobile, rail on md+) */
  onMainSidebarToggle?: () => void;
}

const convIconBtn =
  "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

const overviewActionClass =
  "size-10 shrink-0 rounded-full bg-fill-neutral-weak p-0 [&_svg]:size-5";

function OverviewStreakButton() {
  const { user } = useStore();
  return (
    <StreakTracker>
      <button
        type="button"
        aria-label={`Streak: ${user?.streak || 0} days`}
        className={cn(
          overviewActionClass,
          "relative flex cursor-pointer items-center justify-center transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-neutral-strong",
        )}
      >
        <OverviewDesignIcon name="streak" alt="Streak" />
        <span
          aria-hidden
          className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-bg-neutral px-1 font-geist text-[10px] font-semibold leading-none text-text-neutral-strong ring-1 ring-stroke-neutral-weak"
        >
          {user?.streak || 0}
        </span>
      </button>
    </StreakTracker>
  );
}

/** Matches the dashboard's reopen control; hidden while the sidebar is open. */
function OverlaySidebarToggle() {
  const sidebar = useOverlaySidebar();
  return (
    <button
      type="button"
      data-sidebar-toggle=""
      onClick={sidebar?.expand}
      aria-expanded={sidebar?.expanded ?? false}
      aria-label="Expand sidebar"
      className={cn(
        convIconBtn,
        "sidebar-reopen-button",
        sidebar?.expanded && "md:hidden",
      )}
    >
      <House className="size-5" strokeWidth={1.75} aria-hidden />
    </button>
  );
}

export function DashboardHeader(props: DashboardHeaderProps) {
  const overlay = props.overlay;
  useEffect(() => {
    if (!overlay) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k")
        return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea") || target?.isContentEditable)
        return;
      event.preventDefault();
      event.stopPropagation();
      overlay.onSearch();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [overlay]);

  if (!overlay) return <DashboardPageHeader {...props} />;
  return (
    <header
      data-slot="dashboard-overlay-header"
      className="navigation-header grid shrink-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 px-4 py-3 sm:flex sm:justify-between sm:px-8 sm:py-6"
    >
      <div className="contents sm:flex sm:min-w-0 sm:items-center sm:gap-4">
        <OverlaySidebarToggle />
        <div className="col-span-2 row-start-2 min-w-0">{overlay.title}</div>
      </div>
      <div className="col-start-2 row-start-1 flex items-center justify-end gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon-lg"
          className={overviewActionClass}
          aria-label={overlay.searchLabel}
          aria-expanded={overlay.searchExpanded}
          onClick={overlay.onSearch}
        >
          <IconSearch aria-hidden />
        </Button>
        {overlay.showAccountControls ? (
          <ThemeSwitcher
            lightIcon={<OverviewDesignIcon name="sun" />}
            darkIcon={<OverviewDesignIcon name="sun" />}
            className={overviewActionClass}
            contentClassName="navigation-menu"
          />
        ) : null}
        <QuickTools
          overview
          icon={<OverviewDesignIcon name="tools" />}
          className={overviewActionClass}
          contentClassName="z-[120]"
        />
        {overlay.showAccountControls ? <OverviewStreakButton /> : null}
        <Button
          variant="ghost"
          size="icon-lg"
          className={overviewActionClass}
          aria-label={overlay.closeLabel}
          onClick={overlay.onClose}
        >
          <X aria-hidden />
        </Button>
      </div>
    </header>
  );
}

function DashboardPageHeader({
  onMenuClick,
  mobileSidebarOpen = false,
  mainSidebarCollapsed = false,
  onMainSidebarToggle,
}: DashboardHeaderProps) {
  const location = useLocation();
  const mdUp = useMdViewport();
  const chatConversationMatch = useMatch({ path: "/chat/:id", end: true });
  const chatVoiceMatch = useMatch({ path: "/chat/:id/voice", end: true });
  const topicConversationMatch = useMatch({
    path: "/chat/reply/:id",
    end: true,
  });
  const { chrome } = useConversationChrome();

  const path =
    location.pathname === "/chat/people"
      ? "chat"
      : location.pathname.replace("/", "");
  const pathForTitle = path.startsWith("settings")
    ? "settings"
    : path.startsWith("capsule") || path.startsWith("time-capsule")
      ? "capsule"
      : path;
  const { user, headerTitle } = useStore();
  const { open } = useModal();
  const { actions } = useDashboardHeaderActions();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;
      if (e.key !== "k" && e.key !== "K") return;
      const el = e.target as HTMLElement | null;
      if (!el) return;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable) {
        return;
      }
      e.preventDefault();
      open("search-memory");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const showConversationNav = Boolean(
    (chatConversationMatch || chatVoiceMatch || topicConversationMatch) &&
      chrome,
  );

  const host = showConversationNav ? chrome?.hostChat : undefined;
  const conversationTitle =
    host?.title ?? headerTitle ?? chrome?.memory?.title ?? "New conversation";
  const createdLine =
    chrome?.memory?.created_at &&
    dayjs(chrome.memory.created_at).format("MMM DD, YYYY");
  const metaLine = host?.subtitle ?? createdLine;

  const showChatWorkspace =
    location.pathname.startsWith("/chat") &&
    !chatVoiceMatch &&
    !location.pathname.startsWith("/chat/reply/") &&
    !location.pathname.startsWith("/chat/reflection/");
  const usesOverviewNav =
    showChatWorkspace ||
    showConversationNav ||
    !pathForTitle.startsWith("chat") ||
    pathForTitle.startsWith("chat/reply/");
  const railExpanded = mdUp ? !mainSidebarCollapsed : mobileSidebarOpen;
  const toggleMainSidebar = onMainSidebarToggle ?? onMenuClick;

  return (
    <div
      className={cn(
        "navigation-header dashboard-header-surface z-[45] w-full h-[60px] fixed top-0 left-0 right-0 sm:relative flex items-center",
        dashboardInset(location.pathname),
        showChatWorkspace
          ? "sm:h-[86px] sm:items-center"
          : usesOverviewNav
            ? "sm:h-[76px] sm:items-start sm:pb-4 sm:pt-6"
            : "border-b border-border",
      )}
    >
      <div className="dashboard-header-blur" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <header
        className={cn(
          "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:gap-x-4",
          usesOverviewNav
            ? "lg:grid-cols-[minmax(0,1fr)_272px_auto]"
            : "lg:grid-cols-[minmax(220px,1fr)_minmax(280px,560px)_auto] xl:grid-cols-[minmax(240px,1fr)_minmax(320px,620px)_auto]",
        )}
      >
        <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            data-sidebar-toggle=""
            onClick={toggleMainSidebar}
            className={cn(
              convIconBtn,
              !railExpanded && "sidebar-reopen-button",
              showConversationNav ? "flex md:hidden" : "hidden md:flex",
              usesOverviewNav && !mainSidebarCollapsed && "md:hidden",
              showConversationNav && mainSidebarCollapsed && "md:flex",
            )}
            aria-expanded={railExpanded}
            aria-label={
              showConversationNav
                ? "Open sidebar"
                : railExpanded
                  ? "Collapse sidebar"
                  : "Expand sidebar"
            }
          >
            <span
              className="t-icon-swap"
              data-state={railExpanded ? "b" : "a"}
              aria-hidden
            >
              <span className="t-icon" data-icon="a">
                <House className="size-5" strokeWidth={1.75} />
              </span>
              <span className="t-icon" data-icon="b">
                <PanelLeft className="size-5" strokeWidth={1.75} />
              </span>
            </span>
          </button>
          {chatVoiceMatch?.params?.id ? (
            <Link
              to={`/chat/${chatVoiceMatch.params.id}`}
              replace
              className={cn(convIconBtn, "no-underline")}
              aria-label="Back to chat"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </Link>
          ) : null}
          {showChatWorkspace ? (
            <ChatSwitcher />
          ) : showConversationNav ? (
            <div className="flex min-w-0 items-center gap-1">
              <h1
                className="min-w-0 truncate font-inter text-base font-semibold text-foreground"
                title={conversationTitle}
              >
                Chat
              </h1>
              {metaLine ? (
                <>
                  <span
                    aria-hidden
                    className="hidden size-[5px] shrink-0 rounded-full bg-text-neutral-weaker lg:block"
                  />
                  <span
                    className="hidden min-w-0 truncate font-geist text-sm text-text-neutral-weaker lg:inline"
                    aria-label={
                      host?.subtitle ? metaLine : `Created ${metaLine}`
                    }
                  >
                    {host?.subtitle ? metaLine : `Active since ${metaLine}`}
                  </span>
                </>
              ) : null}
            </div>
          ) : (
            <span className="min-w-0 truncate font-inter font-semibold text-base text-foreground capitalize">
              {truncateText(
                defaultHeaderTitle[pathForTitle] || headerTitle,
                32,
              )}
            </span>
          )}
        </div>

        {pathForTitle !== "stories" ? (
          <div
            className={cn(
              "col-start-2 row-start-1 hidden w-full min-w-0 justify-self-center lg:col-start-2 lg:block",
              "h-10",
            )}
          >
            <button
              type="button"
              onClick={() =>
                host?.onSearch ? host.onSearch() : open("search-memory")
              }
              className={cn(
                "flex w-full cursor-pointer items-center rounded-lg border border-border bg-background",
                usesOverviewNav ? "h-10 bg-fill-neutral-weak" : "h-10",
                "focus-visible:ring-2 focus-visible:ring-v3-brand-strong focus-visible:ring-offset-2",
              )}
              data-search-trigger
              aria-label={
                showConversationNav ? "Search memories" : "Open search"
              }
              aria-haspopup="dialog"
            >
              <span className="pl-3.5">
                <IconSearch
                  width={usesOverviewNav ? 20 : 16}
                  height={usesOverviewNav ? 20 : 16}
                  className="text-muted-foreground"
                  aria-hidden
                />
              </span>
              <span className="flex-1 px-2 text-left font-inter text-sm text-muted-foreground">
                Search
              </span>
              {!usesOverviewNav && <SearchCommandShortcut className="pr-2.5" />}
            </button>
          </div>
        ) : null}

        <div
          className={cn(
            "col-start-2 flex items-center justify-end lg:col-start-3",
            usesOverviewNav ? "gap-2 sm:gap-3" : "gap-2",
          )}
        >
          <ThemeSwitcher
            lightIcon={
              usesOverviewNav ? <OverviewDesignIcon name="sun" /> : undefined
            }
            darkIcon={
              usesOverviewNav ? <OverviewDesignIcon name="sun" /> : undefined
            }
            className={cn(
              overviewActionClass,
              (showChatWorkspace || showConversationNav) && "max-sm:hidden",
            )}
            contentClassName="navigation-menu"
          />
          <QuickTools
            overview={usesOverviewNav}
            icon={
              usesOverviewNav ? <OverviewDesignIcon name="tools" /> : undefined
            }
            className={overviewActionClass}
          />
          {showConversationNav ? (
            <>
              {chrome?.spokenReplies ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  className={cn(
                    overviewActionClass,
                    chrome.spokenReplies.enabled
                      ? "text-text-brand-strong"
                      : "text-icon-neutral-weak",
                  )}
                  aria-label="Read AI replies aloud"
                  aria-pressed={chrome.spokenReplies.enabled}
                  aria-busy={chrome.spokenReplies.isLoading || undefined}
                  title={
                    !chrome.spokenReplies.supported
                      ? "Spoken replies are unavailable in this browser"
                      : chrome.spokenReplies.enabled
                        ? "Turn off spoken replies"
                        : "Turn on spoken replies"
                  }
                  disabled={!chrome.spokenReplies.supported}
                  onClick={chrome.spokenReplies.onToggle}
                >
                  {chrome.spokenReplies.isLoading ? (
                    <Spinner
                      aria-hidden
                      className="motion-reduce:animate-none"
                    />
                  ) : chrome.spokenReplies.enabled ? (
                    <Volume2 aria-hidden />
                  ) : (
                    <VolumeX aria-hidden />
                  )}
                </Button>
              ) : null}
              {chrome?.memory?._id && chrome.onOpenChatPreferences ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  className={cn(overviewActionClass, "text-icon-neutral-weak")}
                  aria-label="Chat settings"
                  onClick={chrome.onOpenChatPreferences}
                >
                  <MoreHorizontal aria-hidden />
                </Button>
              ) : null}
            </>
          ) : (
            <StreakTracker>
              <button
                type="button"
                aria-label={`Streak: ${user?.streak || 0} days`}
                className={cn(
                  overviewActionClass,
                  "relative flex cursor-pointer items-center justify-center transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-neutral-strong",
                )}
              >
                {usesOverviewNav ? (
                  <OverviewDesignIcon name="streak" alt="Streak" />
                ) : (
                  <img
                    src={zapIcon}
                    alt="Streak"
                    className="size-5 object-contain opacity-80"
                  />
                )}
                <span
                  aria-hidden
                  className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-bg-neutral px-1 font-geist text-[10px] font-semibold leading-none text-text-neutral-strong ring-1 ring-stroke-neutral-weak"
                >
                  {user?.streak || 0}
                </span>
              </button>
            </StreakTracker>
          )}
          {pathForTitle === "stories" && actions.showStoriesActions ? (
            <div className="hidden h-10 items-stretch xl:flex">
              <StoriesActionButtons
                compactInNav
                onViewInsights={() => open("memory-insights")}
                onCreateMemory={() => open("create-memory")}
                onQuickCapture={() => open("quick-capture")}
              />
            </div>
          ) : null}
          {!showConversationNav ? (
            <button
              type="button"
              onClick={onMenuClick}
              data-sidebar-toggle=""
              aria-label="Open sidebar"
              className="flex size-10 shrink-0 items-center justify-center rounded-full md:hidden text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <MenuIcon width={20} height={20} />
            </button>
          ) : null}
        </div>
      </header>
    </div>
  );
}
