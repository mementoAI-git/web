import { useEffect, useState } from "react";
import SlideIcon from "@/public/icon/dashboard/slide.svg";
import { bottomNavigations, settingNavigations, topNavigations } from "./navigations";
import SideBarItem from "./SideBarItem";
import Logo from "@/components/Logo";
import DoubleRightArrowIcon from "@/public/icon/double-right-arrow.svg"
import { cn, isEmpty } from "@/utility";
import { usePathname } from "next/navigation";
import Link from "next/link";
import StorageTracker from "./StorageTracker";
import TimesIcon from "@/public/icon/times.svg";

interface DashboardSideBarProps {
  onClose?: () => void;
}

export function DashboardSideBar({ onClose }: DashboardSideBarProps) {
  const [collapse, setCollapse] = useState(false)
  const [subNavs, setSubNavs] = useState([])
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname.includes("settings")) {
      setSubNavs([])
      setCollapse(false)
    } else {
      setCollapse(true)
      setSubNavs(settingNavigations)
    }
  }, [pathname])

  return (
    <aside className="flex items-stretch h-full">
      <div className={`group ${collapse ? "close w-fit min-w-[96px]" : "w-full max-w-[250px]"} transition-all duration-500 ease-in-out overflow-x-hidden bg-white`}>
        <div className="h-full border-r border-grey-500">
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
                  {/* Desktop Collapse Button */}
                  {
                    !pathname.includes("settings") &&
                    <div
                      onClick={() => setCollapse(p => !p)}
                      className={`text-[rgba(0,13,77,0.45)] cursor-pointer hidden lg:block ${collapse ? "rotate-0" : "rotate-180"} transition-all  duration-500 ease-in-out`}
                    >
                      <DoubleRightArrowIcon />
                    </div>
                  }
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-center text-grey-600 font-inter hidden group-[.close]:inline-block text-sm">Menu</span>
                <div className="flex flex-col gap-1 sm:gap-2">
                  {topNavigations.map((n, i) => (
                    <SideBarItem {...n} active={n.link === pathname} key={i} />
                  ))}
                  <SideBarItem
                    Icon={SlideIcon}
                    title="settings"
                    active={pathname.includes("settings")}
                    link="/settings/profile"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-center text-grey-600 font-inter hidden group-[.close]:inline-block text-sm">More</span>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col gap-1 sm:gap-2">
                  {bottomNavigations.map((n, i) => (
                    <SideBarItem {...n} active={n.link === pathname} key={i} />
                  ))}
                </div>
                <StorageTracker />
              </div>
            </div>
          </div>
        </div>
      </div>
      {
        !isEmpty(subNavs) &&
        <div className="w-full min-w-69 space-y-4 bg-white px-4 sm:px-6 border-r border-grey-500 py-6 sm:py-8">
          <div className="flex items-center justify-between">
            <h5 className="font-inter text-lg sm:text-xl text-secondary font-bold px-3 py-2">Settings</h5>
            {onClose && (
              <div onClick={onClose} className={cn("modal-close-btn !relative !top-0 !right-0 lg:!hidden", { "!hidden": !collapse })}>
                <TimesIcon width={8.33} height={8.33} />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1 sm:gap-2">
            {settingNavigations.map((n, i) => (
              <Link
                href={n.link}
                key={i}
                className={`flex items-center gap-2 rounded-[6px] w-full h-9 sm:h-10 cursor-pointer ${n.link === pathname ? "text-primary bg-grey-400" : "text-[#344054] bg-transparent"} hover:text-primary hover:bg-grey-400 font-inter px-3 py-2 text-sm sm:text-base`}
              >
                <span className="capitalize font-medium"> {n.title} </span>
              </Link>
            ))}
          </div>
        </div>
      }
    </aside>
  );
}
