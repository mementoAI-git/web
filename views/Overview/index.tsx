"use client"

import ActivitySummary from "./ActivitySummary"
import WelcomSection from "./WelcomSection"
import BrowseTopics from "./Topics"

export default function Overview() {
  return (
    <div className="max-w-[1038px] w-full mx-auto">
      <WelcomSection />
      <ActivitySummary />
      <BrowseTopics />
    </div>
  )
}