import { Searchinput } from "@/components/Form";
import { useStore } from "@/hooks/use-store";
import { isEmpty } from "@/utility";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";
import MenuIcon from "@/public/icon/menu.svg"
import { useModal } from "@/hooks/use-modal";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import dayjs from "dayjs";
import { mutate } from "swr";

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
  const { trigger } = useFetcher(endpoint.updateStreak)

  useEffect(() => {
    if (isEmpty(user)) return;
    if (!dayjs().isSame(user?.last_seen, "date")) {
      trigger()
        .then(res => {
          if (res.data) mutate(endpoint.profile)
        })
        .catch(console.log)
    }
  }, [user, trigger, mutate])

  return (
    <div className="w-full border-b border-grey-500">
      <header className="mx-auto flex max-h-23 w-[93%] items-center justify-between gap-4 sm:gap-6 py-4 sm:py-6">
        <div className="flex items-center gap-4 sm:gap-6 flex-1">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-grey-400 transition-colors"
          >
            <MenuIcon width={20} height={20} />
          </button>

          {
            !isEmpty(headerTitle[path]) &&
            <div className="shrink-0 hidden sm:block text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bricolage text-secondary font-medium leading-11 capitalize truncate max-w-full">
              {headerTitle[path]}
            </div>
          }
          <div className="h-10 max-w-150 flex-1">
            <Searchinput />
          </div>
        </div>
        <div className="flex max-h-10 shrink-0 items-center gap-2 sm:gap-4 font-inter">
          <div className="h-full cursor-pointer space-x-1 rounded-full bg-grey-400 px-3 sm:px-5 py-2">
            <span>✌🏾</span>
            <span className="font-semibold text-grey-600 text-sm sm:text-base">{user?.streak || 0}</span>
          </div>
          {
            path === "chat" ?
              <div
                onClick={() => open("chat-settings")}
                className="size-8 sm:size-10 cursor-pointer text-white rounded-full flex justify-center items-center bg-grey-600"
              >
                <MenuIcon width={12} height={8} className="sm:w-[15px] sm:h-[10px]" />
              </div> :
              <React.Fragment>
                <div className="h-full cursor-pointer rounded-full border border-[rgba(199,201,200,1)] px-3 sm:px-5 py-2 hidden sm:block">
                  <span className="font-semibold text-grey-600 text-sm sm:text-base">Invite friends</span>
                </div>
                <div className="h-full cursor-pointer rounded-full border border-[rgba(199,201,200,1)] px-3 sm:px-5 py-2 hidden sm:block">
                  <span className="font-semibold text-grey-600 text-sm sm:text-base">Help</span>
                </div>
              </React.Fragment>
          }
        </div>
      </header>
    </div>
  );
}
