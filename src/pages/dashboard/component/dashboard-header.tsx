import { ChatDesignIcon } from "@/components/chat-design-icon";
import { QuickTools } from "@/components/quick-tools";
import { ThemeSwitcher } from "@/components/theme-switcher";
import zapIcon from "@/assets/icon/zap.svg";
import {
  ChevronLeft,
  PanelLeft,
} from "lucide-react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
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
import { SearchCommandShortcut } from "@/components/search-command-shortcut";

const defaultHeaderTitle: Record<string, string> = {
  memories: "my memories",
  stories: "my stories",
  chat: "chat with AI",
  explore: "explore",
  overview: "overview",
  settings: "settings",
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
  onMenuClick?: () => void;
  /** Mobile drawer open (main left nav) */
  mobileSidebarOpen?: boolean;
  /** Desktop: main left nav width collapsed */
  mainSidebarCollapsed?: boolean;
  /** Toggle main left nav (drawer on mobile, rail on md+) */
  onMainSidebarToggle?: () => void;
}

const convIconBtn =
  "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

export function DashboardHeader({
  onMenuClick,
  mobileSidebarOpen = false,
  mainSidebarCollapsed = false,
  onMainSidebarToggle,
}: DashboardHeaderProps) {
  const location = useLocation();
  const mdUp = useMdViewport();
  const chatConversationMatch = useMatch({ path: "/chat/:id", end: true });
  const chatVoiceMatch = useMatch({ path: "/chat/:id/voice", end: true });
  const { chrome } = useConversationChrome();

  const path = location.pathname.replace("/", "");
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
    (chatConversationMatch || chatVoiceMatch) && chrome,
  );

  if (showConversationNav && chrome) {
    const host = chrome.hostChat;
    const title =
      host?.title ?? headerTitle ?? chrome.memory?.title ?? "New conversation";
    const createdLine =
      chrome.memory?.created_at &&
      dayjs(chrome.memory.created_at).format("MMM DD, YYYY");
    const metaLine = host?.subtitle ?? createdLine;

    const actionClass = "flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-fill-neutral-weak text-icon-neutral-weak transition-colors hover:bg-fill-neutral-weaker sm:w-[52px]";
    return (
      <div className="fixed inset-x-0 top-0 z-[45] flex h-[60px] w-full items-center bg-background px-4 sm:relative sm:h-[76px] sm:items-start sm:px-8 sm:pb-4 sm:pt-6">
        <header className="flex h-9 w-full min-w-0 items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <button type="button" onClick={onMainSidebarToggle ?? onMenuClick} aria-label="Open sidebar" className={cn(actionClass, "mr-2 md:hidden", mainSidebarCollapsed && "md:flex")}>
              <PanelLeft className="size-5" aria-hidden />
            </button>
            {chatVoiceMatch?.params?.id ? (
              <Link to={`/chat/${chatVoiceMatch.params.id}`} replace className={cn(actionClass, "mr-2 no-underline")} aria-label="Back to chat"><ChevronLeft className="size-5" aria-hidden /></Link>
            ) : null}
            <h1 className="min-w-0 truncate font-inter text-sm font-semibold text-foreground" title={title}>Chat</h1>
            {metaLine ? <>
              <span aria-hidden className="hidden size-[5px] shrink-0 rounded-full bg-text-neutral-weaker lg:block" />
              <span className="hidden min-w-0 truncate font-geist text-sm text-text-neutral-weaker lg:inline" aria-label={host?.subtitle ? metaLine : `Created ${metaLine}`}>{host?.subtitle ? metaLine : `Active since ${metaLine}`}</span>
            </> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button type="button" onClick={() => chrome.hostChat?.onSearch ? chrome.hostChat.onSearch() : open("search-memory")} className={cn(actionClass, "lg:mr-1 lg:w-[272px] lg:justify-start lg:gap-2 lg:border lg:border-stroke-neutral-weak lg:px-3.5")} aria-label="Search memories">
              <ChatDesignIcon name="search" /><span className="hidden font-inter text-sm text-text-neutral-weaker lg:inline">Search</span>
            </button>
            <ThemeSwitcher className={cn(actionClass, "text-overview-greeting")} lightIcon={<ChatDesignIcon name="sun" />} />
            {chrome.memory?._id && chrome.onOpenChatPreferences ? <>
              <button type="button" className={actionClass} aria-label="Audio settings" onClick={() => chrome.onOpenChatPreferences?.()}><ChatDesignIcon name="audio" /></button>
              <button type="button" className={actionClass} aria-label="Chat settings" onClick={() => chrome.onOpenChatPreferences?.()}><ChatDesignIcon name="more" /></button>
            </> : null}
          </div>
        </header>
      </div>
    );
  }

  const usesOverviewNav =
    pathForTitle === "overview" ||
    pathForTitle === "" ||
    pathForTitle === "explore";
  const overviewActionClass = "h-8 w-[52px] rounded-lg bg-fill-neutral-weak";
  const railExpanded = mdUp ? !mainSidebarCollapsed : mobileSidebarOpen;
  const toggleMainSidebar = onMainSidebarToggle ?? onMenuClick;

  return (
    <div
      className={cn(
        "w-full h-[60px] fixed top-0 left-0 right-0 sm:relative flex items-center bg-background px-4 sm:px-8",
        usesOverviewNav
          ? "sm:h-[76px] sm:items-start sm:pb-4 sm:pt-6"
          : "border-b border-border",
      )}
    >
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
            onClick={toggleMainSidebar}
            className={cn(
              convIconBtn,
              "hidden md:flex",
              usesOverviewNav && !mainSidebarCollapsed && "md:hidden",
            )}
            aria-expanded={railExpanded}
            aria-label={railExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            <PanelLeft className="size-5" strokeWidth={1.75} aria-hidden />
          </button>
          <span className="min-w-0 truncate font-inter font-semibold text-base text-foreground capitalize">
            {truncateText(defaultHeaderTitle[pathForTitle] || headerTitle, 32)}
          </span>
        </div>

        {pathForTitle !== "stories" ? (
          <div
            className={cn(
              "col-start-2 row-start-1 hidden w-full min-w-0 justify-self-center lg:col-start-2 lg:block",
              usesOverviewNav ? "h-9" : "h-10",
            )}
          >
            <button
              type="button"
              onClick={() => open("search-memory")}
              className={cn(
                "flex w-full cursor-pointer items-center rounded-lg border border-border bg-background",
                usesOverviewNav ? "h-9 bg-fill-neutral-weak" : "h-10",
                "focus-visible:ring-2 focus-visible:ring-v3-brand-strong focus-visible:ring-offset-2",
              )}
              aria-label="Open search"
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
            usesOverviewNav ? "gap-3" : "gap-2",
          )}
        >
          <ThemeSwitcher
            className={
              usesOverviewNav
                ? `${overviewActionClass} text-overview-greeting`
                : undefined
            }
          />
          <QuickTools
            overview={usesOverviewNav}
            className={usesOverviewNav ? overviewActionClass : undefined}
          />
          <StreakTracker>
            <div
              className={cn(
                "flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-muted",
                usesOverviewNav ? overviewActionClass : "bg-transparent",
              )}
            >
              <img
                src={zapIcon}
                alt="Streak"
                className={cn(
                  "object-contain opacity-80",
                  usesOverviewNav ? "size-5" : "size-4",
                )}
              />
              {!usesOverviewNav && (
                <span className="text-[13px] font-semibold text-foreground">
                  {user?.streak || 0}
                </span>
              )}
            </div>
          </StreakTracker>
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
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open sidebar"
            className="md:hidden p-1.5 rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <MenuIcon width={20} height={20} />
          </button>
        </div>
      </header>
    </div>
  );
}
