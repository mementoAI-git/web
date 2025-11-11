import menuIcon from "@/assets/icon/menu.svg?url";
import searchIcon from "@/assets/icon/dashboard/search.svg?url";
import blueFire from "@/assets/image/blue-fire.png";
import greenDiamond from "@/assets/image/green-diamond-full.png";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import Logo from "@/components/logo";
import StreakTracker from "@/components/streak-tracker";
import { useLocation, useNavigate } from "react-router-dom";
import { ProfileDropdown } from "./profile-dropdown";
import { Searchinput } from "@/components/Form";

const defaultHeaderTitle: Record<string, string> = {
  memories: "my memories",
  chat: "chat with AI",
  explore: "explore",
  overview: "overview",
  "time-capsule": "time capsule",
};

const truncateText = (text: string, maxLength = 25): string => {
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
    <div className="header-container fixed left-0 right-0 top-0 w-full border-b border-grey-500 sm:relative">
      <header className="mx-auto flex max-h-20 !w-[93%] max-w-[1160px] items-center justify-between gap-4 sm:gap-6 py-4 sm:py-5">
        <div className="flex flex-1 items-center gap-4 sm:gap-6">
          <button type="button" onClick={handleLogoClick} className="cursor-pointer md:hidden">
            <Logo />
          </button>

          <div className="hidden max-w-[200px] truncate font-garamond text-2xl font-medium capitalize text-gray-950/90 md:block">
            {truncateText(defaultHeaderTitle[path] ?? headerTitle ?? "overview")}
          </div>
        </div>

        <div className="hidden max-h-10 shrink-0 items-center gap-2 font-inter sm:gap-4 md:flex">
          <button
            type="button"
            onClick={() => open?.("search-memory")}
            className="hidden h-10 max-w-[336px] flex-1 sm:block"
          >
            <Searchinput className="!bg-white border-gray-200" />
          </button>
          <button
            type="button"
            onClick={() => open?.("search-memory")}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[rgba(208,213,221,1)] bg-white sm:hidden"
          >
            <img src={searchIcon} alt="Search" className="size-5" />
          </button>
          <div className="flex h-full shrink-0 cursor-pointer items-center space-x-1 rounded-lg px-3 py-2 transition-colors duration-200 hover:bg-[#B1D9584D] sm:px-5">
            <img src={greenDiamond} alt="Points" className="size-5 object-contain" />
            <span className="text-sm font-semibold text-grey-600 sm:text-base">0</span>
          </div>
          <StreakTracker>
            <div className="flex h-full shrink-0 cursor-pointer items-center space-x-1 rounded-lg px-3 py-2 transition-colors duration-200 sm:px-5">
              <img src={blueFire} alt="Streak" className="size-5 object-contain" />
              <span className="text-sm font-semibold text-grey-600 sm:text-base">
                {user?.streak ?? 0}
              </span>
            </div>
          </StreakTracker>
          <div className="h-5 border-l border-gray-200" />
          <ProfileDropdown />
        </div>

        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 transition-colors hover:bg-grey-400 md:hidden"
        >
          <img src={menuIcon} alt="Open menu" className="size-5" />
        </button>
      </header>
    </div>
  );
}
