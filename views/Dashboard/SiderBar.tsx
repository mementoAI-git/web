import { useState } from "react";
import SlideIcon from "@/public/icon/dashboard/slide.svg";
import { bottomNavigations, topNavigations } from "./navigations";
import SideBarItem from "./SideBarItem";
import Logo, { LogoV2 } from "@/components/Logo";
import DoubleRightArrowIcon from "@/public/icon/double-right-arrow.svg"
import { cn } from "@/utility";
import { usePathname, useRouter } from "next/navigation";
import TimesIcon from "@/public/icon/times.svg";
import Link from "next/link";

interface DashboardSideBarProps {
  onClose?: () => void;
}

export function DashboardSideBar({ onClose }: DashboardSideBarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogoClick = () => {
    router.push("/overview");
    onClose()
  }

  return (
    <div className="dynamic-height w-full max-w-80.5 min-h-screen overflow-x-hidden border-r border-gray-200">
      <div className="flex size-full max-h-300 flex-col justify-between">
        <div className="w-full">
          <div onClick={handleLogoClick} className="shrink-0 p-5 pl-6">
            <LogoV2 />
          </div>
          <div className="flex py-8 px-4 flex-col gap-1 sm:gap-2">
            {topNavigations.map((n, i) => (
              <SideBarItem {...n} active={n.link === pathname} key={i} onClick={onClose} />
            ))}
            <SideBarItem
              Icon={SlideIcon}
              title="settings"
              active={pathname.includes("settings")}
              link="/settings/profile"
              onClick={onClose}
            />
          </div>
        </div>
        <div className="flex py-8 px-4 w-full flex-col gap-1 sm:gap-2">
          {bottomNavigations.map((n, i) => (
            <SideBarItem {...n} active={n.link === pathname} key={i} onClick={onClose} />
          ))}
        </div>
      </div>
    </div>
  );
}
