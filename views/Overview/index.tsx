"use client"

import Streak from "./Streak";
import DailyPrompt from "./DailyPrompt";
import PromptResponseModal from "./OverviewModal";
import { usePrompt } from "@/hooks/use-prompt";
import Topics from "./Topics";
import StartConversation from "./StartConversation";
import RecentActivities from "./RecentActivities";

export default function Overview() {
  const { push } = usePrompt()
  return (
    <div className="w-full">
      <PromptResponseModal />
      <div className="flex items-stretch gap-3 py-8">
        <StartConversation />
        <Streak />
      </div>

      <div className="py-8">
        <span className="text-lg font-inter font-semibold text-grey-900">
          Today’s memory prompts
          <span className="text-grey-800"> 0/2</span>
        </span>
        <div className="flex items-stretch gap-3 mt-2">
          <div className="flex-1 flex flex-col gap-10">
            <div className="flex flex-wrap items-stretch gap-3">
              <DailyPrompt type="question" onClick={() => push("prompt")} />
              <DailyPrompt type="quiz" onClick={() => push("prompt")} />
            </div>
            <div className="space-y-5">
              <div className="flex items-center justify-between text-grey-600 font-semibold text-lg font-inter">
                <span>Browse conversations by topics</span>
                <span className="text-sm cursor-pointer">See all</span>
              </div>
              <div className="flex flex-wrap items-stretch gap-3">
                <Topics />
                <Topics />
                <Topics />
                <Topics />
              </div>
            </div>
          </div>

          <RecentActivities />
        </div>
      </div>
    </div>
  )
}