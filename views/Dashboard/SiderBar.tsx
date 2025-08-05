import { useState } from "react";
import SlideIcon from "@/public/icon/dashboard/slide.svg";
import { bottomNavigations, topNavigations } from "./navigations";
import SideBarItem from "./SideBarItem";
import Logo from "@/components/Logo";
import DoubleRightArrowIcon from "@/public/icon/double-right-arrow.svg"
import { cn } from "@/utility";
import { usePathname } from "next/navigation";
import TimesIcon from "@/public/icon/times.svg";

interface DashboardSideBarProps {
  onClose?: () => void;
}

export function DashboardSideBar({ onClose }: DashboardSideBarProps) {
  const [collapse, setCollapse] = useState(false)
  const pathname = usePathname();

  return (
    <aside className="flex items-stretch h-full">
      <div className={`group ${collapse ? "close w-fit" : "w-69"} transition-all duration-500 ease-in-out overflow-x-hidden bg-white`}>
        <div className="h-full">
          <div className="flex h-full max-h-300 flex-col justify-between group-[.close]:justify-start group-[.close]:gap-4 px-3 sm:px-4 py-6 sm:py-8">
            <div className="space-y-6 sm:space-y-8">
              <div className="flex items-center justify-between gap-3">
                <div className="shrink-0">
                  <Logo size={28} textClassName="!text-[20px] sm:!text-[24.24px] group-[.close]:hidden" />
                </div>
                <div className="flex items-center gap-2">
                  {/* Mobile Close Button */}
                  {onClose && (
                    <div onClick={onClose} className={cn("modal-close-btn !relative !top-0 !right-0 lg:!hidden", { "!hidden": collapse })}>
                      <TimesIcon width={8.33} height={8.33} />
                    </div>
                  )}
                  <div
                    onClick={() => setCollapse(p => !p)}
                    className={`text-[rgba(0,13,77,0.45)] cursor-pointer hidden lg:block ${collapse ? "rotate-0" : "rotate-180"} transition-all  duration-500 ease-in-out`}
                  >
                    <DoubleRightArrowIcon />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-center text-grey-600 font-inter hidden group-[.close]:inline-block text-sm">Menu</span>
                <div className="flex flex-col gap-1 sm:gap-2">
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
            </div>
            <div className="space-y-2">
              <span className="text-center text-grey-600 font-inter hidden group-[.close]:inline-block text-sm">More</span>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col gap-1 sm:gap-2">
                  {bottomNavigations.map((n, i) => (
                    <SideBarItem {...n} active={n.link === pathname} key={i} onClick={onClose} />
                  ))}
                </div>
                {/* <StorageTracker /> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
