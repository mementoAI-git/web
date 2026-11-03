import DailyPromptSection from "./daily-prompt-section";
import RecentStoriesSection from "./recent-stories-section";

export default function ActivitySummary() {
  return (
    <div className="flex min-w-0 flex-col gap-10 sm:gap-16">
      <DailyPromptSection />
      <RecentStoriesSection />
    </div>
  );
}
