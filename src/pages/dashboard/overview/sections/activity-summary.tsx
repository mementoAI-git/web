import DailyPromptSection from "./daily-prompt-section";

export default function ActivitySummary() {
  return (
    <div className="w-full flex flex-col gap-5 pb-16">
      <h2 className="font-garamond font-normal text-sand-12 text-xl sm:text-2xl lg:text-[32px] leading-[38px]">
        Continue
        <i className="text-[rgba(176,169,156,0.9)]"> reflecting</i>
      </h2>
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        <DailyPromptSection />
      </div>
    </div>
  );
}

