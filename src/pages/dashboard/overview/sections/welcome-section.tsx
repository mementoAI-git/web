import { Link } from "react-router-dom";
import Slider from "@/components/slider";
import StreakTracker from "@/components/streak-tracker";
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
import memoryContextBg from "@/assets/icon/memory context bg.svg";
import { isEmpty } from "@/utility";

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

function StreakCount() {
  const { user } = useStore();
  return (
    <StreakTracker>
      <div className="w-full flex-1 flex items-center relative border border-black/5 rounded-2xl overflow-hidden p-4 gap-2">
        <img src={memoryContextBg} alt="" className="absolute top-0 right-0 left-0 object-cover size-full" />
        <div className="relative z-10 flex flex-col max-w-[216.86px] gap-2 font-inter">
          <span className="text-gray-500 font-inter font-normal uppercase text-xs">Streak count</span>
          <span className="text-sm text-gray-700 font-inter font-bold">
            {isEmpty(user?.streak) ? (
              "You have no streak"
            ) : (
              <>You’re on a <span style={{ color: "#F06037" }}>{user?.streak}-day</span> streak</>
            )}
          </span>
          <span className="text-gray-600 font-normal font-inter text-sm">Complete reflections each day so your streak won’t reset</span>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
          <img src={zapIcon} alt="streak" className="size-12 object-contain opacity-80" />
        </div>
      </div>
    </StreakTracker>
  );
}

function Leaderboard() {
  return (
    <div className="w-full flex-1 flex items-center border border-black/5 rounded-2xl overflow-hidden relative p-4 gap-2">
      <img src={memoryContextBg} alt="" className="absolute top-0 right-0 left-0 object-cover size-full" />
      <div className="relative z-10 flex flex-col gap-2 font-inter">
        <span className="text-gray-400 uppercase text-xs">XP leaderboard</span>
        <span className="text-sm text-gray-700 font-bold">Global ranking coming soon</span>
        <span className="text-gray-600 text-sm">Coming soon</span>
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
        <img src={trophyIcon} alt="trophy" className="size-12 object-contain" />
      </div>
    </div>
  );
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
        <div className="block md:hidden">
          <Slider>
            <StreakCount />
            <Leaderboard />
          </Slider>
        </div>
        <div className="w-full hidden md:flex flex-rol items-stretch gap-3 md:flex-col md:flex-1 lg:max-w-[335px]">
          <StreakCount />
          <Leaderboard />
        </div>
      </div>
    </div>
  );
}

