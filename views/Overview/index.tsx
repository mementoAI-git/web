"use client"

import ActivitySummary from "./ActivitySummary"
import WelcomSection from "./WelcomSection"
import BrowseTopics from "./Topics"
import { useEffect } from "react";
import { useModal } from "@/hooks/use-modal";
import { storageKeys } from "@/utility/constant";

export default function Overview() {
  const { open } = useModal();

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(storageKeys.welcomeOnce) === '1') {
      localStorage.removeItem(storageKeys.welcomeOnce);
      open('welcome');
    }
  }, []);
  return (
    <div className="max-w-[1038px] w-full mx-auto">
      <WelcomSection />
      <ActivitySummary />
      <BrowseTopics />
    </div>
  )
}