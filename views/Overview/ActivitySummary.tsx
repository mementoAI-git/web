"use client"

import DailyPromptSection from "./DailyPromptSection";
import RecentActivitiesSection from "./RecentActivitesSection";

export default function ActivitySummary() {
  return (
    <div className="w-full space-y-6 sm:space-y-8 lg:space-y-10 py-6 sm:py-9 lg:py-12">
      <h2 className="font-canela text-sand-12 font-normal text-xl sm:text-2xl lg:text-[32px] leading-[38px]">
        Continue
        <i className="text-gray-500"> reflecting</i>
      </h2>
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        <DailyPromptSection />
        <RecentActivitiesSection />
      </div>
    </div>
  )
}
