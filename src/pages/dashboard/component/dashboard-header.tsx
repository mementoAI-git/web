import zapIcon from "@/assets/icon/zap.svg";
import {
  ChevronLeft,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  MoreHorizontal,
  Phone,
  Volume2,
} from "lucide-react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import StreakTracker from "@/components/streak-tracker";
import { Link, useLocation, useMatch } from "react-router-dom";
import { cn } from "@/utility";
import { MenuIcon, SearchIcon } from "@/components/icons";
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

/** Conversation header actions use a subtle surface and stronger icon on hover. */
const convHeaderActionGhost =
  "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

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

    const railExpanded = mdUp ? !mainSidebarCollapsed : mobileSidebarOpen;
    const toggleMainSidebar = onMainSidebarToggle ?? onMenuClick;

    return (
      <div className="w-full h-[60px] fixed top-0 left-0 right-0 sm:relative z-[45] flex items-center border-b border-border bg-background px-3 sm:px-5">
        <header className="flex w-full min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            {chatVoiceMatch?.params?.id ? (
              <Link
                to={`/chat/${chatVoiceMatch.params.id}`}
                replace
                className={cn(convIconBtn, "no-underline")}
                aria-label="Back to chat"
              >
                <ChevronLeft
                  className="size-5"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </Link>
            ) : (
              <button
                type="button"
                onClick={toggleMainSidebar}
                className={convIconBtn}
                aria-expanded={railExpanded}
                aria-label={
                  railExpanded ? "Collapse sidebar" : "Expand sidebar"
                }
              >
                {railExpanded ? (
                  <PanelLeftClose
                    className="size-5"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                ) : (
                  <PanelLeftOpen
                    className="size-5"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                )}
              </button>
            )}
            <h1
              className="min-w-0 truncate font-inter text-sm font-semibold text-foreground sm:text-base"
              title={title}
            >
              Chat
            </h1>
            {metaLine ? (
              <span
                className="hidden min-w-0 truncate font-inter text-xs text-muted-foreground lg:inline"
                aria-label={host?.subtitle ? metaLine : `Created ${metaLine}`}
              >
                {metaLine}
              </span>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2 text-muted-foreground">
            {chrome.hostChat?.onSearch ? (
              <button
                type="button"
                onClick={() => chrome.hostChat?.onSearch?.()}
                className={cn(
                  convHeaderActionGhost,
                  "lg:h-9 lg:w-60 lg:justify-start lg:gap-2 lg:rounded-lg lg:border lg:border-border lg:bg-background lg:px-3 xl:w-80",
                )}
                aria-label="Search memories"
              >
                <SearchIcon
                  className="size-4 shrink-0 text-current"
                  aria-hidden
                />
                <span className="hidden font-inter text-sm text-muted-foreground lg:inline">
                  Search
                </span>
              </button>
            ) : null}
            {chrome.memory?._id && chrome.onOpenChatPreferences ? (
              <button
                type="button"
                className={convHeaderActionGhost}
                aria-label="Audio settings"
                onClick={() => chrome.onOpenChatPreferences?.()}
              >
                <Volume2 className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
              </button>
            ) : null}
            {chatConversationMatch?.params?.id ? (
              <Link
                to={`/chat/${chatConversationMatch.params.id}/voice`}
                className={cn(convHeaderActionGhost, "no-underline")}
                aria-label="Voice mode"
              >
                <Phone className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
              </Link>
            ) : null}
            {chrome.memory?._id && chrome.onOpenChatPreferences ? (
              <button
                type="button"
                className={convHeaderActionGhost}
                aria-label="Chat settings"
                onClick={() => chrome.onOpenChatPreferences?.()}
              >
                <MoreHorizontal className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
              </button>
            ) : null}
          </div>
        </header>
      </div>
    );
  }

  const railExpanded = mdUp ? !mainSidebarCollapsed : mobileSidebarOpen;
  const toggleMainSidebar = onMainSidebarToggle ?? onMenuClick;

  return (
    <div className="w-full h-[60px] fixed top-0 left-0 right-0 sm:relative flex items-center bg-background border-b border-border px-4 sm:px-8">
      <header className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:grid-cols-[minmax(220px,1fr)_minmax(280px,560px)_auto] lg:gap-x-4 xl:grid-cols-[minmax(240px,1fr)_minmax(320px,620px)_auto]">
        <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleMainSidebar}
            className={cn(convIconBtn, "hidden md:flex")}
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
          <div className="col-start-2 row-start-1 hidden h-10 w-full min-w-0 justify-self-center lg:col-start-2 lg:block">
            <button
              type="button"
              onClick={() => open("search-memory")}
              className={cn(
                "flex h-10 w-full cursor-pointer items-center rounded-lg border border-border bg-background",
                "focus-visible:ring-2 focus-visible:ring-v3-brand-strong focus-visible:ring-offset-2",
              )}
              aria-label="Open search"
              aria-haspopup="dialog"
            >
              <span className="pl-3.5">
                <IconSearch
                  width={16}
                  height={16}
                  className="text-muted-foreground"
                  aria-hidden
                />
              </span>
              <span className="flex-1 px-2 text-left font-inter text-sm text-muted-foreground">
                Search
              </span>
              <SearchCommandShortcut className="pr-2.5" />
            </button>
          </div>
        ) : null}

        <div className="col-start-2 flex items-center justify-end gap-2 lg:col-start-3">
          <StreakTracker>
            <div className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-transparent px-2.5 py-1.5 transition-colors hover:bg-muted">
              <img
                src={zapIcon}
                alt="Streak"
                className="size-4 object-contain opacity-80"
              />
              <span className="text-[13px] font-semibold text-foreground">
                {user?.streak || 0}
              </span>
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
