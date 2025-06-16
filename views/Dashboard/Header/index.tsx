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

export function DashboardHeader() {
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
      <header className="mx-auto flex max-h-23 w-[93%] items-center justify-between gap-6 py-6">
        <div className="flex items-center gap-6 flex-1">
          {
            !isEmpty(headerTitle[path]) &&
            <div className="shrink-0 text-4xl font-bricolage text-secondary font-medium leading-11 capitalize">
              {headerTitle[path]}
            </div>
          }
          <div className="h-10 max-w-150 flex-1">
            <Searchinput />
          </div>
        </div>
        <div className="flex max-h-10 shrink-0 items-center gap-4 font-inter">
          <div className="h-full cursor-pointer space-x-1 rounded-full bg-grey-400 px-5 py-2">
            <span>✌🏾</span>
            <span className="font-semibold text-grey-600">{user?.streak || 0}</span>
          </div>
          {
            path === "chat" ?
              <div
                onClick={() => open("chat-settings")}
                className="size-10 cursor-pointer text-white rounded-full flex justify-center items-center bg-grey-600"
              >
                <MenuIcon width={15} height={10} />
              </div> :
              <React.Fragment>
                <div className="h-full cursor-pointer rounded-full border border-[rgba(199,201,200,1)] px-5 py-2">
                  <span className="font-semibold text-grey-600">Invite friends</span>
                </div>
                <div className="h-full cursor-pointer rounded-full border border-[rgba(199,201,200,1)] px-5 py-2">
                  <span className="font-semibold text-grey-600">Help</span>
                </div>
              </React.Fragment>
          }
        </div>
      </header>
    </div>
  );
}
