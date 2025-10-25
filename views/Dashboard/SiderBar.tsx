import { useState } from "react";
import SlideIcon from "@/public/icon/dashboard/slide.svg";
import { bottomNavigations, topNavigations } from "./navigations";
import SideBarItem from "./SideBarItem";
import { LogoV2 } from "@/components/Logo";
import { usePathname, useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal";

interface DashboardSideBarProps {
  onClose?: () => void;
}

export function DashboardSideBar({ onClose }: DashboardSideBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { open } = useModal();

  const handleLogoClick = () => {
    router.push("/overview");
    onClose?.()
  }

  return (
    <div className="dynamic-height w-full min-h-screen overflow-x-hidden border-r border-gray-200 bg-background">
      <div className="flex size-full max-h-300 flex-col justify-between">
        <div className="w-full">
          <div className="flex items-center justify-between p-5 pl-6">
            <div onClick={handleLogoClick} className="cursor-pointer">
              <LogoV2 />
            </div>
          </div>
          <div className="flex py-4 md:py-8 px-4 flex-col gap-1 sm:gap-2">
            {topNavigations.map((n, i) => (
              <SideBarItem {...n} active={n.link === pathname} key={i} onClick={onClose} />
            ))}
            <SideBarItem
              Icon={SlideIcon}
              title="settings"
              onClick={() => open("settings")}
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
