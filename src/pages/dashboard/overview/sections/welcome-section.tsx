import { Link } from "react-router-dom";
import { PlusIcon } from "@/components/icons";
import { useModal } from "@/hooks/use-modal";
import { useStore } from "@/hooks/use-store";
import { useMemo } from "react";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import bgCard from "@/assets/icon/folder/empty-get-started.png";
import brightButtonIcon from "@/assets/icon/noto_bright-button.svg";
import zapIcon from "@/assets/icon/zap.svg";
import trophyIcon from "@/assets/icon/noto_trophy.svg";
// deprecated backgrounds — kept for reference
// import _bg2 from "@/assets/icon/folder/side cards for streak.png";
// import _bg3 from "@/assets/icon/folder/green side cards for streak.png";
import memoryContextBgPng from "@/assets/icon/memory context bg.png";

function getGreeting(): string {
  const hour = new Date().getHours();
  const greetings =
    hour >= 4 && hour < 7
      ? ["Up early today,", "Starting the day early,", "Rise and shine,"]
      : hour >= 7 && hour < 12
        ? ["Good morning,", "Back at it,", "Morning,"]
        : hour >= 12 && hour < 17
          ? ["Good afternoon,", "Welcome back,", "Afternoon,"]
          : hour >= 17 && hour < 21
            ? ["Good evening,", "Evening,", "Ready to reflect,"]
            : hour >= 21
              ? ["Keeping a late night,", "Night owl mode,", "Burning the midnight oil,"]
              : ["Still going,", "Can't sleep,", "Late night session,"];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

export default function WelcomeSection() {
  const { user } = useStore();
  const { open } = useModal();
  const greeting = useMemo(() => getGreeting(), []);
  const { data: statsData } = useSWR(endpoint.userStats);
  const stats = statsData?.data ?? {};
  const streakCount = Number(user?.streak) || Number(stats.streak_count) || 0;
  const xpCount = Number(stats.xp_count) || 0;

  return (
    <div className="w-full space-y-6 sm:space-y-8 lg:space-y-10 py-6 sm:py-9 lg:py-12">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <img src={brightButtonIcon} alt="" className="size-10 shrink-0" />
          <h2 className="font-garamond text-gray-800 font-normal text-[24px] sm:text-[32px] lg:text-[40px] leading-[1.2]">
            {greeting}
            {
              user?.first_name &&
              <i style={{ color: "#376B59" }}> {user?.first_name}.</i>
            }
          </h2>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        <div className="relative rounded-2xl overflow-hidden flex-1 min-h-[144px] sm:min-h-[200px] shadow-none" style={{ border: "1px solid rgba(0,0,0,0.03)", boxShadow: "none" }}>
          <img src={bgCard} alt="" className="absolute top-0 right-0 left-0 object-cover size-full" />
          <div className="absolute flex flex-col justify-between size-full top-0 right-0 left-0 p-5 sm:p-7 lg:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-garamond text-[16px] sm:text-[20px] lg:text-[24px] font-normal text-[#353434]">What’s on your mind today?</h2>
              <div className="flex items-center gap-3 shrink-0">
                <span className="flex items-center gap-1.5 font-inter text-sm font-semibold text-gray-700">
                  <img src={zapIcon} alt="streak" className="size-5" />
                  {streakCount}
                </span>
                <span className="flex items-center gap-1.5 font-inter text-sm font-semibold text-gray-700">
                  <img src={trophyIcon} alt="xp" className="size-5" />
                  {xpCount}
                </span>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 items-center">
              <button
                onClick={() => open("create-memory")}
                className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-12 px-3 sm:px-5 rounded-full font-inter font-semibold text-xs sm:text-sm text-white cursor-pointer transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#FF5E00" }}
              >
                <PlusIcon className="size-3 sm:size-4 shrink-0" />
                <span className="whitespace-nowrap">Add story/item</span>
              </button>
              <Link
                to="/chat/new"
                className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-12 px-3 sm:px-5 bg-white border border-gray-200 rounded-full cursor-pointer hover:opacity-90 transition-opacity"
              >
                <span className="text-[#101828] text-xs sm:text-sm font-inter font-semibold whitespace-nowrap">Start a conversation</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="w-full lg:max-w-[335px] relative rounded-2xl overflow-hidden min-h-[144px] sm:min-h-[200px] flex-1">
          <img src={memoryContextBgPng} alt="" className="absolute inset-0 object-cover size-full" />
        </div>
      </div>
    </div>
  );
}

