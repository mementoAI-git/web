import trophyIcon from "@/assets/icon/noto_trophy.svg";
import zapIcon from "@/assets/icon/zap.svg";
import { Bell, Home, PanelLeftClose, PanelLeftOpen, Pencil, Plus, Share2 } from "lucide-react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import StreakTracker from "@/components/streak-tracker";
import { useLocation, useMatch, useNavigate } from "react-router-dom";
import { cn } from "@/utility";
import { MenuIcon, SearchIcon } from "@/components/icons";
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
  chatOpen?: boolean;
  onChatToggle?: () => void;
  /** Mobile drawer open (main left nav) */
  mobileSidebarOpen?: boolean;
  /** Desktop: main left nav width collapsed */
  mainSidebarCollapsed?: boolean;
  /** Toggle main left nav (drawer on mobile, rail on md+) */
  onMainSidebarToggle?: () => void;
}

const convIconBtn =
  "flex size-9 shrink-0 items-center justify-center rounded-xl bg-v3-fill-weaker text-v3-icon-neutral transition-colors cursor-pointer hover:bg-v3-fill-weak";

export function DashboardHeader({
  onMenuClick,
  chatOpen,
  onChatToggle,
  mobileSidebarOpen = false,
  mainSidebarCollapsed = false,
  onMainSidebarToggle,
}: DashboardHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
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

  const showConversationNav = Boolean(chatConversationMatch && chrome);

  if (showConversationNav && chrome) {
    const title =
      headerTitle || chrome.memory?.title || "New conversation";
    const createdLine =
      chrome.memory?.created_at &&
      dayjs(chrome.memory.created_at).format("MMM DD, YYYY");

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
                className={cn(convIconBtn, "hidden sm:flex")}
                aria-label="Edit topic"
              >
                <Pencil className="size-4" strokeWidth={1.75} aria-hidden />
              </button>
            ) : null}
            {createdLine ? (
              <span
                className="hidden font-inter text-xs text-v3-text-weaker lg:inline"
                aria-label={`Created ${createdLine}`}
              >
                {createdLine}
              </span>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {chrome.memory?._id ? (
              <button
                type="button"
                onClick={() => open("share-memory", { memory: chrome.memory! })}
                className={convIconBtn}
                aria-label="Share conversation"
              >
                <Share2 className="size-4" strokeWidth={1.75} aria-hidden />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => navigate("/chat/new")}
              className={convIconBtn}
              aria-label="New chat"
            >
              <Plus className="size-5" strokeWidth={1.75} aria-hidden />
            </button>
            {chrome.memory?._id ? (
              <MemoryDropdown
                memory={chrome.memory}
                onViewDetails={chrome.onViewDetails}
                triggerClassName="!aspect-square !size-9 !p-2 flex items-center justify-center rounded-xl bg-v3-fill-weaker text-v3-icon-neutral hover:bg-v3-fill-weak"
              />
            ) : null}
            <StreakTracker>
              <div className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-v3-fill-weak px-2.5 py-1.5 transition-colors hover:opacity-90">
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
        </header>
      </div>
    );
  }

  return (
    <div className="w-full h-[60px] fixed top-0 left-0 right-0 sm:relative flex items-center bg-white border-b border-black/5 px-4 sm:px-8">
      <header className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-inter font-semibold text-base text-gray-900 capitalize whitespace-nowrap">
            {truncateText(defaultHeaderTitle[pathForTitle] || headerTitle, 32)}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div
            onClick={() => open("search-memory")}
            className="h-9 w-[320px] hidden lg:block"
          >
            <div className="relative group/search">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 group-focus-within/search:text-primary transition-colors" />
              <input
                readOnly
                placeholder="Search"
                className="w-full h-9 pl-9 pr-4 bg-gray-50 border border-transparent rounded-lg text-sm transition-all focus:bg-white focus:border-black/5 outline-none cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => open("recent-activities")}
              className="hidden size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-v3-fill-weak transition-colors hover:bg-gray-100 md:flex"
              aria-label="Recent activities"
            >
              <Bell className="size-5 text-v3-icon-neutral" />
            </button>
            <button
              type="button"
              onClick={onChatToggle}
              className={cn(
                "flex items-center justify-center size-8 rounded-lg transition-colors cursor-pointer",
                chatOpen
                  ? "bg-gradient-to-br from-[#FF8944] to-[#FF3CDF] hover:opacity-90"
                  : "bg-v3-fill-weak hover:opacity-90",
              )}
              aria-label={chatOpen ? "Close chat" : "Open chat"}
              aria-pressed={chatOpen}
            >
              {chatOpen ? (
                <Home
                  className="size-5 text-white"
                  strokeWidth={1.75}
                  aria-hidden
                />
              ) : (
                <Home
                  className="size-5 text-v3-icon-neutral opacity-65"
                  strokeWidth={1.75}
                  aria-hidden
                />
              )}
            </button>
            <div className="hidden shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-v3-fill-weak px-2.5 py-1.5 transition-colors hover:opacity-90 sm:flex">
              <img
                src={trophyIcon}
                alt="XP"
                className="size-4 object-contain"
              />
              <span className="text-[13px] font-semibold text-gray-700">0</span>
            </div>

            <StreakTracker>
              <div className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-v3-fill-weak px-2.5 py-1.5 transition-colors hover:opacity-90">
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
