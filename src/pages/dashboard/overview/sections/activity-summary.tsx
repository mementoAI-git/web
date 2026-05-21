import DailyPromptSection from "./daily-prompt-section";
import RecentActivitiesSection from "./recent-activities-section";

export default function ActivitySummary() {
  return (
    <div className="flex w-full min-w-0 flex-col pb-12 sm:pb-16">
      <div className="flex flex-col gap-8 md:gap-10 xl:flex-row xl:items-stretch xl:gap-12">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 sm:gap-5">
          <h2 className="font-garamond font-normal text-text-neutral-strong text-xl leading-tight sm:text-2xl sm:leading-[38px] lg:text-[32px]">
            Continue{" "}
            <i className="text-text-neutral-weaker">reflecting</i>
          </h2>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <DailyPromptSection />
          </div>
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col xl:max-w-[400px] xl:shrink-0">
          <RecentActivitiesSection />
        </div>
      </div>
    </div>
  );
}

