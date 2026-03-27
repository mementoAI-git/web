import zapIcon from "@/assets/icon/zap.svg";
import {
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Share2,
} from "lucide-react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import StreakTracker from "@/components/streak-tracker";
import { useLocation, useMatch } from "react-router-dom";
import { cn } from "@/utility";
import { MenuIcon, SearchIcon } from "@/components/icons";
import { IconSearch, InputGroup, Kbd } from "@heroui/react";
import { useConversationChrome } from "@/contexts/conversation-chrome";
import { MemoryDropdown } from "@/pages/dashboard/chat/conversation/dropdown";

const defaultHeaderTitle: Record<string, string> = {
  memories: "my memories",
  stories: "my stories",
  chat: "chat with AI",
  explore: "explore",
  overview: "overview",
  settings: "settings",
  capsule: "time capsule",
  "time-capsule": "time capsule",
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
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
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
  "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-v3-fill-weaker text-v3-icon-neutral transition-colors hover:bg-v3-fill-weak hover:text-v3-text-strong";

/** Conversation header actions: transparent chip, v3 fill + stronger icon on hover */
const convHeaderActionGhost =
  "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-transparent text-v3-icon-neutral transition-colors hover:bg-v3-fill-weak hover:text-v3-text-strong";

export function DashboardHeader({
  onMenuClick,
  mobileSidebarOpen = false,
  mainSidebarCollapsed = false,
  onMainSidebarToggle,
}: DashboardHeaderProps) {
  const location = useLocation();
  const mdUp = useMdViewport();
  const chatConversationMatch = useMatch({ path: "/chat/:id", end: true });
  const { chrome } = useConversationChrome();

  const path = location.pathname.replace("/", "");
  const pathForTitle = path.startsWith("settings")
    ? "settings"
    : path.startsWith("capsule") || path.startsWith("time-capsule")
      ? "capsule"
      : path;
  const { user, headerTitle } = useStore();
  const { open } = useModal();

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

  const showConversationNav = Boolean(chatConversationMatch && chrome);

  if (showConversationNav && chrome) {
    const host = chrome.hostChat;
    const title =
      host?.title ??
      headerTitle ??
      chrome.memory?.title ??
      "New conversation";
    const createdLine =
      chrome.memory?.created_at &&
      dayjs(chrome.memory.created_at).format("MMM DD, YYYY");
    const metaLine = host?.subtitle ?? createdLine;

    const railExpanded = mdUp ? !mainSidebarCollapsed : mobileSidebarOpen;
    const toggleMainSidebar = onMainSidebarToggle ?? onMenuClick;

    return (
      <div className="w-full h-[60px] fixed top-0 left-0 right-0 sm:relative z-[45] flex items-center border-b border-v3-stroke-weak bg-white px-3 sm:px-5">
        <header className="flex w-full min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleMainSidebar}
              className={convIconBtn}
              aria-expanded={railExpanded}
              aria-label={railExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              {railExpanded ? (
                <PanelLeftClose className="size-5" strokeWidth={1.75} aria-hidden />
              ) : (
                <PanelLeftOpen className="size-5" strokeWidth={1.75} aria-hidden />
              )}
            </button>
            <h1
              className="min-w-0 truncate font-inter text-sm font-semibold text-v3-text-strong sm:text-base"
              title={title}
            >
              {title}
            </h1>
            {chrome.memory?._id ? (
              <button
                type="button"
                onClick={() =>
                  open("set-tag-permission", {
                    memory: chrome.memory!,
                    isNew: false,
                  })
                }
                className={cn(convHeaderActionGhost, "hidden sm:flex")}
                aria-label="Edit topic"
              >
                <Pencil className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
              </button>
            ) : null}
            {metaLine ? (
              <span
                className="hidden min-w-0 truncate font-inter text-xs text-v3-text-weaker lg:inline"
                aria-label={host?.subtitle ? metaLine : `Created ${metaLine}`}
              >
                {metaLine}
              </span>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2 text-v3-icon-neutral">
            {chrome.memory?._id ? (
              <button
                type="button"
                onClick={() => open("share-memory", { memory: chrome.memory! })}
                className={convHeaderActionGhost}
                aria-label="Share conversation"
              >
                <Share2 className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
              </button>
            ) : null}
            {chrome.hostChat?.onSearch ? (
              <button
                type="button"
                onClick={() => chrome.hostChat?.onSearch?.()}
                className={convHeaderActionGhost}
                aria-label="Search memories"
              >
                <SearchIcon className="size-4 shrink-0 text-current" aria-hidden />
              </button>
            ) : null}
            {chrome.memory?._id ? (
              <MemoryDropdown
                memory={chrome.memory}
                onViewDetails={chrome.onViewDetails}
                onExportConversation={chrome.onExportConversation}
                triggerClassName="!aspect-square !size-9 !p-2 flex items-center justify-center rounded-xl bg-transparent text-v3-icon-neutral transition-colors hover:bg-v3-fill-weak hover:text-v3-text-strong"
              />
            ) : null}
          </div>
        </header>
      </div>
    );
  }

  const railExpanded = mdUp ? !mainSidebarCollapsed : mobileSidebarOpen;
  const toggleMainSidebar = onMainSidebarToggle ?? onMenuClick;

  return (
    <div className="w-full h-[60px] fixed top-0 left-0 right-0 sm:relative flex items-center bg-white border-b border-black/5 px-4 sm:px-8">
      <header className="w-full flex items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleMainSidebar}
            className={cn(convIconBtn, "hidden md:flex")}
            aria-expanded={railExpanded}
            aria-label={railExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            <PanelLeft className="size-5" strokeWidth={1.75} aria-hidden />
          </button>
          <span className="min-w-0 truncate font-inter font-semibold text-base text-gray-900 capitalize">
            {truncateText(defaultHeaderTitle[pathForTitle] || headerTitle, 32)}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden h-10 w-[320px] lg:block">
            <InputGroup
              fullWidth
              onClick={() => open("search-memory")}
              className={cn(
                "h-10 cursor-pointer rounded-full border border-v3-stroke-weak bg-white",
                "shadow-[0px_2px_12px_rgba(23,11,0,0.06)] transition-shadow",
                "hover:shadow-[0px_4px_16px_rgba(23,11,0,0.08)]",
                "has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-v3-brand-strong has-[input:focus-visible]:ring-offset-2",
              )}
              aria-label="Open search"
            >
              <InputGroup.Prefix className="pl-3.5">
                <IconSearch
                  width={16}
                  height={16}
                  className="text-v3-text-weak"
                  aria-hidden
                />
              </InputGroup.Prefix>
              <InputGroup.Input
                readOnly
                tabIndex={0}
                placeholder="Search"
                aria-haspopup="dialog"
                className="cursor-pointer font-inter text-sm text-v3-text-strong placeholder:text-v3-text-weaker"
              />
              <InputGroup.Suffix className="pr-2.5">
                <span className="inline-flex items-center gap-1" aria-hidden>
                  <Kbd className="rounded-md border border-v3-stroke-weak bg-v3-fill-weaker px-1.5 py-0.5 font-inter text-[10px] font-medium text-v3-text-strong">
                    <Kbd.Abbr keyValue="command" />
                  </Kbd>
                  <Kbd className="rounded-md border border-v3-stroke-weak bg-v3-fill-weaker px-1.5 py-0.5 font-inter text-[10px] font-medium text-v3-text-strong">
                    <Kbd.Content>K</Kbd.Content>
                  </Kbd>
                </span>
              </InputGroup.Suffix>
            </InputGroup>
          </div>

          <div className="flex items-center gap-2">
            <StreakTracker>
              <div className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-transparent px-2.5 py-1.5 transition-colors hover:bg-v3-fill-weak">
                <img
                  src={zapIcon}
                  alt="Streak"
                  className="size-4 object-contain opacity-70"
                />
                <span className="text-[13px] font-semibold text-gray-700">
                  {user?.streak || 0}
                </span>
              </div>
            </StreakTracker>
          </div>
        </div>

        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <MenuIcon width={20} height={20} />
        </button>
      </header>
    </div>
  );
}
