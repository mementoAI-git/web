import MLogoIcon from "@/assets/icon/letterM.svg?react";
import blueFire from "@/assets/image/blue-fire.png";
import greenDiamond from "@/assets/image/green-diamond-full.png";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import StreakTracker from "@/components/streak-tracker";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRightIcon, MenuIcon, SearchIcon } from "@/components/icons";

const defaultHeaderTitle: Record<string, string> = {
  memories: "my memories",
  stories: "my stories",
  chat: "chat with AI",
  explore: "explore",
  overview: "overview",
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
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname.replace("/", "");
  const { user, headerTitle } = useStore();
  const { open } = useModal();

  const handleLogoClick = () => {
    navigate("/overview");
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
                {truncateText(defaultHeaderTitle[path] || headerTitle, 32)}
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
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent">
              <img
                src={greenDiamond}
                alt="Diamond"
                className="size-4 object-contain"
              />
              <span className="font-semibold text-gray-700 text-[13px]">0</span>
            </div>

            <StreakTracker>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent">
                <img
                  src={blueFire}
                  alt="Streak"
                  className="size-4 object-contain"
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
