import DailyPromptSection from "./daily-prompt-section";
import RecentActivitiesSection from "./recent-activities-section";

export default function ActivitySummary() {
  return (
    <div className="w-full space-y-6 sm:space-y-8 lg:space-y-10 py-6 sm:py-9 lg:py-12">
      <h2 className="font-garamond font-medium text-sand-12 text-xl sm:text-2xl lg:text-[32px] leading-[38px]">
        Continue
        <i className="text-[rgba(176,169,156,0.9)]"> reflecting</i>
      </h2>
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        <DailyPromptSection />
        <RecentActivitiesSection />
      </div>
    </div>
  );
}

