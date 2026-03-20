import DailyPromptSection from "./daily-prompt-section";
import RecentActivitiesSection from "./recent-activities-section";

export default function ActivitySummary() {
  return (
    <div className="flex w-full flex-col pb-16">
      <div className="flex flex-col gap-12 lg:flex-row lg:items-stretch">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-5">
          <h2 className="font-garamond font-normal text-sand-12 text-xl sm:text-2xl lg:text-[32px] leading-[38px]">
            Continue{" "}
            <i className="text-[rgba(176,169,156,0.9)]">reflecting</i>
          </h2>
          <div className="flex min-h-0 flex-1 flex-col">
            <DailyPromptSection />
          </div>
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:max-w-[400px]">
          <RecentActivitiesSection />
        </div>
      </div>
    </div>
  );
}

