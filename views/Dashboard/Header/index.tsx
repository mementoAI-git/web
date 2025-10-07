import { Searchinput } from "@/components/Form";
import { useStore } from "@/hooks/use-store";
import { isEmpty } from "@/utility";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import MenuIcon from "@/public/icon/menu.svg"
import SearchIcon from "@/public/icon/dashboard/search.svg"
import { useModal } from "@/hooks/use-modal";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import dayjs from "dayjs";
import { mutate } from "swr";
import { LogoV2 } from "@/components/Logo";
import blueFire from "@/public/image/blue-fire.png"
import Image from "next/image";
import StreakTracker from "@/components/StreakTracker";
import { ProfileDropdown } from "../ProfileDropdown";

const headerTitle = {
  "memories": "my memories",
  "chat": "chat with AI",
  "explore": "explore",
  "time-capsule": "time capsule"
}

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const path = usePathname().replace('/', "")
  const { user } = useStore()
  const { open } = useModal()
  const router = useRouter();

  const handleLogoClick = () => {
    router.push("/overview");
    // onClose?.()
  }

  return (
    <div className="w-full fixed top-0 left-0 right-0  border-b border-grey-500 sm:relative header-container">
      <header className="mx-auto flex max-h-23 w-[93%] max-w-[1160px] items-center justify-between gap-4 sm:gap-6 px-2 py-4 sm:py-6">
        <div className="flex items-center gap-4 sm:gap-6 flex-1">
          <div onClick={handleLogoClick} className="cursor-pointer md:hidden">
            <LogoV2 />
          </div>
          {
            !isEmpty(headerTitle[path]) &&
            <div className="page-title hidden sm:block">
              {headerTitle[path]}
            </div>
          }

          <div
            onClick={() => open("search-memory")}
            className="h-10 max-w-150 flex-1 hidden sm:block"
          >
            <Searchinput />
          </div>
        </div>
        <div className="hidden md:flex max-h-10 shrink-0 items-center gap-2 sm:gap-4 font-inter">
          <div onClick={() => open("search-memory")} className="h-10 w-10 flex items-center justify-center rounded-lg border border-[rgba(208,213,221,1)] bg-white sm:hidden">
            <SearchIcon width={20} height={20} />
          </div>
          <StreakTracker>
            <div
              className="h-full shrink-0 flex gap-1 cursor-pointer space-x-1 px-3 sm:px-5 py-2 hover:bg-blue-3 rounded-lg transition-colors duration-200"
            >
              <Image src={blueFire} alt="Streak blue fire" className="size-5 object-contain" />
              <span className="font-semibold text-grey-600 text-sm sm:text-base">{user?.streak || 0}</span>
            </div>
          </StreakTracker>
          <div className="border-l border-gray-200 h-5" />
          <ProfileDropdown />
        </div>
        {/* Mobile Menu Button */}
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
