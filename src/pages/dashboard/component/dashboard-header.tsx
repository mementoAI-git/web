import blueFire from "@/assets/image/blue-fire.png";
import greenDiamond from "@/assets/image/green-diamond-full.png";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import Logo from "@/components/logo";
import StreakTracker from "@/components/streak-tracker";
import { useLocation, useNavigate } from "react-router-dom";
import { ProfileDropdown } from "./profile-dropdown";
import { Searchinput } from "@/components/Form";
import { SearchIcon, MenuIcon } from "@/components/icons";

const defaultHeaderTitle: Record<string, string> = {
  memories: "my memories",
  stories: "my stories",
  chat: "chat with AI",
  explore: "explore",
  overview: "overview",
  "time-capsule": "time capsule",
  "": "overview",
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
  }

  return (
    <div className="w-full fixed top-0 left-0 right-0  border-b border-grey-500 sm:relative header-container">
      <header className="mx-auto flex max-h-20 !w-[93%] max-w-[1160px] items-center justify-between gap-4 sm:gap-6 py-4 sm:py-5">
        <div className="flex items-center gap-4 sm:gap-6">
          <div onClick={handleLogoClick} className="cursor-pointer md:hidden">
            <Logo />
          </div>

          <div className="font-garamond capitalize truncate font-medium max-w-[200px] text-gray-950/90 text-2xl hidden md:block">
            {truncateText(defaultHeaderTitle[path] || headerTitle)}
          </div>
        </div>
        <div className="hidden md:flex max-h-10 shrink-0 items-center gap-2 sm:gap-4 font-inter">
          <div
            onClick={() => open("search-memory")}
            className="h-10 max-w-[336px] flex-1 hidden sm:block"
          >
            <Searchinput className="!bg-white border-gray-200" />
          </div>
          <div onClick={() => open("search-memory")} className="h-10 w-10 flex items-center justify-center rounded-lg border border-[rgba(208,213,221,1)] bg-white sm:hidden">
            <SearchIcon width={20} height={20} />
          </div>
          <div
            className="h-full shrink-0 flex gap-1 cursor-pointer space-x-1 px-3 sm:px-5 py-2 hover:bg-[#B1D9584D] rounded-lg transition-colors duration-200"
          >
            <img src={greenDiamond} alt="Streak blue fire" className="size-5 object-contain" />
            <span className="font-semibold text-grey-600 text-sm sm:text-base">0</span>
          </div>
          <StreakTracker>
            <div
              className="h-full shrink-0 flex gap-1 cursor-pointer hover:bg-blue-3 space-x-1 px-3 sm:px-5 py-2 rounded-lg transition-colors duration-200"
            >
              <img src={blueFire} alt="Streak blue fire" className="size-5 object-contain" />
              <span className="font-semibold text-grey-600 text-sm sm:text-base">{user?.streak || 0}</span>
            </div>
          </StreakTracker>
          <div className="border-l border-gray-200 h-5" />
          <ProfileDropdown />
        </div>
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-grey-400 transition-colors"
        >
          <MenuIcon width={20} height={20} />
        </button>
      </header>
    </div>
  );
}
