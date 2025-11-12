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
      <div className="mx-auto w-full max-w-[1038px]">
        <WelcomeSection />
        <ActivitySummary />
        <BrowseTopics />
      </div>
    </div>
  );
}

