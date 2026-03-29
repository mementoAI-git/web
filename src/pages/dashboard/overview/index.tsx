import { useEffect } from "react";
import { storageKeys } from "@/utility/constant";
import { useModal } from "@/hooks/use-modal";
import ActivitySummary from "./sections/activity-summary";
import BrowseTopics from "./sections/browse-topics";
import WelcomeSection from "./sections/welcome-section";

export default function OverviewPage() {
  const { open } = useModal();

  useEffect(() => {
    if (localStorage.getItem(storageKeys.welcomeOnce) === "1") {
      localStorage.removeItem(storageKeys.welcomeOnce);
      open?.("welcome");
    }
  }, []);

  return (
    <div className="page-viewport hide-scrollbar">
      <div className="mx-auto flex w-full min-w-0 max-w-[1038px] flex-col gap-6 px-4 pb-10 sm:gap-8 sm:px-5 md:px-6 lg:px-8">
        <WelcomeSection />
        <ActivitySummary />
        <BrowseTopics />
      </div>
    </div>
  );
}

