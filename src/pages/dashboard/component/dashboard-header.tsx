import MLogoIcon from "@/assets/icon/letterM.svg?react";
import ellipseAiOrbDark from "@/assets/image/ellipse AI ORB dark.svg";
import ellipseAiOrbWhite from "@/assets/image/ellipse AI ORB white.svg";
import trophyIcon from "@/assets/icon/noto_trophy.svg";
import zapIcon from "@/assets/icon/zap.svg";
import { Bell } from "lucide-react";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import StreakTracker from "@/components/streak-tracker";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/utility";
import { ChevronRightIcon, MenuIcon, SearchIcon } from "@/components/icons";

const defaultHeaderTitle: Record<string, string> = {
  memories: "my memories",
  stories: "my stories",
  chat: "chat with AI",
  explore: "explore",
  overview: "overview",
  settings: "settings",
  "time-capsule": "time capsule",
  "": "overview",
};

const truncateText = (text: string, maxLength = 32): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

interface DashboardHeaderProps {
  onMenuClick?: () => void;
  chatOpen?: boolean;
  onChatToggle?: () => void;
}

export function DashboardHeader({ onMenuClick, chatOpen, onChatToggle }: DashboardHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname.replace("/", "");
  const pathForTitle = path.startsWith("settings") ? "settings" : path;
  const { user, headerTitle } = useStore();
  const { open } = useModal();

  /** Navigate to the "home" of the current section (e.g. /chat when in a conversation, /overview when on overview). */
  const handleLogoClick = () => {
    const segment = location.pathname.split("/").filter(Boolean)[0];
    const sectionRoot = segment ? `/${segment}` : "/overview";
    navigate(sectionRoot);
  };

  return (
    <div className="w-full h-[60px] fixed top-0 left-0 right-0 sm:relative flex items-center bg-white border-b border-black/5 px-4 sm:px-8">
      <header className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              onClick={handleLogoClick}
              className="size-6 cursor-pointer flex items-center justify-center shrink-0"
            >
              <MLogoIcon
                className="size-full object-contain"
                aria-label="Logo"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <ChevronRightIcon
                width={14}
                height={14}
                className="text-gray-400"
              />
              <span className="font-inter font-medium text-sm text-gray-900 capitalize whitespace-nowrap">
                {truncateText(defaultHeaderTitle[pathForTitle] || headerTitle, 32)}
              </span>
            </div>
          </div>
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
              className="hidden flex items-center justify-center size-8 rounded-lg bg-v3-fill-weak transition-colors cursor-pointer hover:bg-gray-100"
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
                <img
                  src={ellipseAiOrbWhite}
                  alt="AI"
                  className="size-5 object-contain"
                />
              ) : (
                <img
                  src={ellipseAiOrbDark}
                  alt="AI"
                  className="size-5 object-contain opacity-65"
                />
              )}
            </button>
            <div className="hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-v3-fill-weak transition-colors cursor-pointer">
              <img
                src={trophyIcon}
                alt="XP"
                className="size-4 object-contain"
              />
              <span className="font-semibold text-gray-700 text-[13px]">0</span>
            </div>

            <StreakTracker>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-v3-fill-weak transition-colors cursor-pointer">
                <img
                  src={zapIcon}
                  alt="Streak"
                  className="size-4 object-contain opacity-70"
                />
                <span className="font-semibold text-gray-700 text-[13px]">
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
