import { useEffect } from "react";
import { storageKeys } from "@/utility/constant";
import { useModal } from "@/hooks/use-modal";
import ActivitySummary from "./sections/activity-summary";
import BrowseTopics from "./sections/browse-topics";
import WelcomeSection from "./sections/welcome-section";

export default function OverviewPage() {
  const { open } = useModal();

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKeys.welcomeOnce) === "1") {
        localStorage.removeItem(storageKeys.welcomeOnce);
        open?.("welcome");
      }
    } catch {
      /* Storage may be unavailable (private mode, embedded context). */
    }
  }, [open]);

  return (
    <div className="page-viewport hide-scrollbar">
      <div className="mx-auto flex w-full min-w-0 max-w-[964px] flex-col gap-10 px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-6 sm:gap-16 sm:px-5 sm:pt-12 sm:pb-10 md:px-6 lg:px-8">
        <WelcomeSection />
        <ActivitySummary />
        <BrowseTopics />
      </div>
    </div>
  );
}
