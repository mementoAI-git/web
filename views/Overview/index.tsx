"use client"

import ActivitySummary from "./ActivitySummary"
import WelcomSection from "./WelcomSection"
import BrowseTopics from "./Topics"
import { useEffect } from "react";
import { useModal } from "@/hooks/use-modal";

export default function Overview() {
  const { open } = useModal();

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('welcome_once') === '1') {
      localStorage.removeItem('welcome_once');
      open && open('welcome');
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