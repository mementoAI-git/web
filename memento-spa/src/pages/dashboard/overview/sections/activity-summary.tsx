import DailyPromptSection from "./daily-prompt-section";
import RecentActivitiesSection from "./recent-activities-section";

export default function ActivitySummary() {
  return (
    <div className="w-full py-6 sm:py-9 lg:py-12">
      <h2 className="font-canela text-xl font-normal leading-[38px] text-sand-12 sm:text-2xl lg:text-[32px]">
        Continue
        <i className="text-gray-500"> reflecting</i>
      </h2>
      <div className="mt-6 flex flex-col items-stretch gap-6 lg:mt-10 lg:flex-row">
        <DailyPromptSection />
        <RecentActivitiesSection />
      </div>
    </div>
  );
}

