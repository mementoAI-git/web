import { useEffect, useState } from "react";
import SlideIcon from "@/public/icon/dashboard/slide.svg";
import { bottomNavigations, settingNavigations, topNavigations } from "./navigations";
import SideBarItem from "./SideBarItem";
import Logo from "@/components/Logo";
import DoubleRightArrowIcon from "@/public/icon/double-right-arrow.svg"
import { isEmpty } from "@/utility";
import { usePathname } from "next/navigation";
import Link from "next/link";
import StorageTracker from "./StorageTracker";

export function DashboardSideBar() {
  const [collapse, setCollapse] = useState(false)
  const [subNavs, setSubNavs] = useState([])
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname.includes("settings")) {
      setSubNavs([])
    } else {
      setCollapse(true)
      setSubNavs(settingNavigations)
    }
  }, [pathname])

  return (
    <aside className={`flex items-stretch ${(!collapse && isEmpty(subNavs)) ? "min-w-[250px]" : ""}`}>
      <div className={`group ${collapse ? "close w-fit min-w-[96px]" : "w-[20%] min-w-[250px]"} transition-all duration-500 ease-in-out overflow-x-hidden`}>
        <div className="h-full border-r border-l border-grey-500">
          <div className="flex h-full max-h-300 flex-col justify-between group-[.close]:justify-start group-[.close]:gap-4 px-4 py-8">
            <div className="space-y-8">
              <div className="flex items-center justify-between gap-3">
                <div className="shrink-0">
                  <Logo size={32} textClassName="!text-[24.24px] group-[.close]:hidden" />
                </div>
                <div
                  onClick={() => setCollapse(p => !p)}
                  className={`text-[rgba(0,13,77,0.45)] cursor-pointer ${collapse ? "rotate-0" : "rotate-180"} transition-all  duration-500 ease-in-out`}
                >
                  <DoubleRightArrowIcon />
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-center text-grey-600 font-inter hidden group-[.close]:inline-block">Menu</span>
                <div className="flex flex-col gap-2">
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
              <span className="text-center text-grey-600 font-inter hidden group-[.close]:inline-block">More</span>
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
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
        <div className="w-full min-w-69 space-y-4 bg-white px-6 border-r border-grey-500 py-8">
          <h5 className="font-inter text-xl text-secondary font-bold px-3 py-2">Settings</h5>
          <div className="flex flex-col gap-2">
            {settingNavigations.map((n, i) => (
              <Link
                href={n.link}
                key={i}
                className={`flex items-center gap-2 rounded-[6px] w-full h-10 cursor-pointer ${n.link === pathname ? "text-primary bg-grey-400" : "text-[#344054] bg-transparent"} hover:text-primary hover:bg-grey-400 font-inter px-3 py-2 `}
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
