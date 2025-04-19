"use client"

import Streak from "./Streak";
import DailyPrompt from "./DailyPrompt";
import PromptResponseModal from "./OverviewModal";
import Topics from "./Topics";
import StartConversation from "./StartConversation";
import RecentActivities from "./RecentActivities";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import { usePrompt } from "@/hooks/use-prompt";

export default function Overview() {
  const { navigations } = usePrompt()
  const { data, isLoading } = useSWR(endpoint.prompts)

  return (
    <div className="w-full">
      {navigations.length > 0 && <PromptResponseModal />}
      <div className="flex items-stretch gap-3 py-8">
        <StartConversation />
        <Streak />
      </div>

      <div className="py-8">
        <span className="text-lg font-inter font-semibold text-grey-900">
          Today’s memory prompts
          <span className="text-grey-800"> 0/{data?.data?.length || 0}</span>
        </span>
        <div className="flex items-stretch gap-3 mt-2">
          <div className="flex-1 flex flex-col gap-10">
            {
              isLoading ?
                <div className="flex flex-wrap items-stretch gap-3 animate-pulse">
                  <div className="rounded-2xl h-72.5 max-w-[368.5px] w-1/2 flex-1 bg-gray-200" />
                  <div className="rounded-2xl h-72.5 max-w-[368.5px] w-1/2 flex-1 bg-gray-200" />
                </div> :
                <div className="flex flex-wrap items-stretch gap-3">
                  {
                    data?.data?.map((item, i) => (
                      <DailyPrompt key={i} {...item} />
                    ))
                  }
                </div>
            }
            <Topics />
          </div>

          <RecentActivities />
        </div>
      </div>
    </div>
  )
}