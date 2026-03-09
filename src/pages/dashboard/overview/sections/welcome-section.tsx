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
import enrichmentBgPng from "@/assets/icon/enrichment bg.png";
import memoriesCardBg from "@/assets/icon/backgrounds/dash memories card.png";
import benefiCardBg from "@/assets/icon/backgrounds/dash benefi card.png";
import timeCapCardBg from "@/assets/icon/backgrounds/dash time cap card.png";
import streakCardBg from "@/assets/icon/backgrounds/side cards for streak.png";
import blueFolderIcon from "@/assets/icon/blue folder 2.svg";
import surferIcon from "@/assets/icon/noto_man-surfing-medium-skin-tone.svg";
import hourglassIcon from "@/assets/icon/noto_hourglass-not-done.svg";

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
              ? [
                  "Keeping a late night,",
                  "Night owl mode,",
                  "Burning the midnight oil,",
                ]
              : ["Still going,", "Can't sleep,", "Late night session,"];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

export default function WelcomeSection() {
  const { user } = useStore();
  const { open } = useModal();
  const greeting = useMemo(() => getGreeting(), []);
  const { data: statsData } = useSWR(endpoint.userStats);
  const { data: memoriesStatsData } = useSWR(endpoint.memoriesStats);
  const { data: storiesListData } = useSWR(`${endpoint.stories}?page=1&limit=1`);
  const { data: beneficiariesData } = useSWR(
    `${endpoint.beneficiaries}?page=1`,
  );
  const { data: capsuleStatsData } = useSWR(endpoint.capsuleStats);
  const stats = statsData?.data ?? {};
  const streakCount = Number(user?.streak) || Number(stats.streak_count) || 0;
  const xpCount = Number(stats.xp_count) || 0;
  const memoriesCount =
    memoriesStatsData?.data?.stories_count ??
    memoriesStatsData?.stories_count ??
    storiesListData?.data?.totalDocs ??
    0;
  const weeklyMemories =
    memoriesStatsData?.data?.week_count ?? memoriesStatsData?.week_count ?? 0;
  const beneficiariesCount = beneficiariesData?.data?.totalDocs || 0;
  const capsuleCount = capsuleStatsData?.data?.scheduled_count || 0;

  return (
    <div className="w-full space-y-6 sm:space-y-8 lg:space-y-10 py-6 sm:py-9 lg:py-12">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <img
            src={brightButtonIcon}
            alt=""
            className="size-7 sm:size-10 shrink-0"
          />
          <h2 className="font-garamond text-gray-800 font-normal text-[24px] sm:text-[32px] lg:text-[40px] leading-[1.2]">
            {greeting}
            {user?.first_name && (
              <i style={{ color: "#376B59" }}> {user?.first_name}.</i>
            )}
          </h2>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        <div className="relative rounded-3xl overflow-hidden flex-1 min-h-[159px] sm:min-h-[200px]">
          <img
            src={bgCard}
            alt=""
            className="absolute top-0 right-0 left-0 object-cover size-full"
          />
          <div className="absolute flex flex-col justify-between size-full top-0 right-0 left-0 p-5 sm:p-7 lg:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-garamond text-[20px] lg:text-[24px] font-normal text-[#353434]">
                What’s on your mind today?
              </h2>
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
                className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-12 px-3 sm:px-5 rounded-full font-inter font-medium text-xs sm:text-sm text-white cursor-pointer transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#FF5E00" }}
              >
                <PlusIcon className="size-3 sm:size-4 shrink-0" />
                <span className="whitespace-nowrap">Add story/item</span>
              </button>
              <Link
                to="/chat/new"
                className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-12 px-3 sm:px-5 bg-white border border-gray-200 rounded-full cursor-pointer hover:opacity-90 transition-opacity"
              >
                <span className="text-[#101828] text-xs sm:text-sm font-inter font-medium whitespace-nowrap">
                  Start a conversation
                </span>
              </Link>
            </div>
          </div>
        </div>
        <div className="w-full lg:max-w-[335px] relative rounded-3xl overflow-hidden flex-1">
          <img
            src={enrichmentBgPng}
            alt=""
            className="absolute inset-0 object-cover w-full h-full"
          />
          <div className="relative flex flex-col justify-between gap-4 p-5 sm:p-6 min-h-[200px]">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span
                  className="font-garamond font-normal leading-none"
                  style={{
                    fontSize: 60,
                    background:
                      "linear-gradient(180deg, #5B9BD5 0%, #A8D4F5 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {Number(stats.enrichment_score) || 0}%
                </span>
                <span className="font-inter text-sm font-normal text-[#413a2f] bg-white/70 rounded-full px-3 py-1.5 whitespace-nowrap">
                  Enrichment score
                </span>
              </div>
              <p className="font-inter text-sm text-gray-700 leading-relaxed">
                Share stories &amp; files to build context. Link apps to enrich
                your Memento.
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <Link
                to="/stories"
                className="flex items-center h-10 px-5 rounded-full font-inter font-semibold text-sm text-white whitespace-nowrap transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#1A1A1A" }}
              >
                See memory
              </Link>
              <Link
                to="/explore"
                className="flex items-center gap-1.5 h-10 px-4 bg-white/80 rounded-full font-inter font-semibold text-sm text-gray-800 whitespace-nowrap transition-opacity hover:opacity-90 border border-black/10"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0"
                >
                  <circle
                    cx="8"
                    cy="3"
                    r="2"
                    stroke="#1A1A1A"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="3"
                    cy="12"
                    r="2"
                    stroke="#1A1A1A"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="13"
                    cy="12"
                    r="2"
                    stroke="#1A1A1A"
                    strokeWidth="1.5"
                  />
                  <line
                    x1="8"
                    y1="5"
                    x2="3"
                    y2="10"
                    stroke="#1A1A1A"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="8"
                    y1="5"
                    x2="13"
                    y2="10"
                    stroke="#1A1A1A"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Connect apps
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* All Memories */}
        <Link
          to="/stories"
          className="relative rounded-2xl overflow-hidden h-[99px] block hover:opacity-95 transition-opacity col-span-2 lg:col-span-1 border border-[#E3E3E3]"
        >
          <img
            src={memoriesCardBg}
            alt=""
            className="absolute inset-0 object-cover w-full h-full rounded-[16px]"
          />
          <div className="relative flex items-center justify-between h-full px-5 font-inter rounded-[16px]">
            <div className="flex flex-col gap-1">
              <span className="font-inter text-[12px] font-normal uppercase tracking-widest text-gray-500">
                All Memories
              </span>
              <span
                className="font-inter text-[14px] font-semibold leading-tight"
                style={{ color: "#293039" }}
              >
                <span className="font-bold" style={{ color: "#2D6BC4" }}>
                  {memoriesCount}
                </span>{" "}
                items
              </span>
              {weeklyMemories > 0 && (
                <span className="font-inter text-[12px] font-normal text-gray-500">
                  +{weeklyMemories} this week
                </span>
              )}
            </div>
            <img
              src={blueFolderIcon}
              alt=""
              className="size-11 object-contain shrink-0"
            />
          </div>
        </Link>

        {/* Beneficiaries */}
        <button
          type="button"
          onClick={() => open("settings", { activeTab: "beneficiary" })}
          className="relative rounded-2xl overflow-hidden h-[99px] block hover:opacity-95 transition-opacity col-span-2 lg:col-span-1 border border-[#E3E3E3] w-full text-left"
        >
          <img
            src={benefiCardBg}
            alt=""
            className="absolute inset-0 object-cover w-full h-full rounded-[16px]"
          />
          <div
            className="relative flex items-center justify-between h-full px-5"
            style={{ color: "rgba(255, 255, 255, 0.9)" }}
          >
            <div className="flex flex-col gap-1">
              <span className="font-inter text-[12px] font-normal uppercase tracking-widest text-[rgba(102,112,133,0.7)]">
                Beneficiaries
              </span>
              <span
                className="font-inter text-[14px] font-semibold leading-tight"
                style={{ color: "rgba(41, 48, 57, 1)" }}
              >
                <span
                  className="font-bold"
                  style={{ color: "rgba(255, 46, 88, 1)" }}
                >
                  {beneficiariesCount}
                </span>{" "}
                {beneficiariesCount === 1 ? "person" : "people"}
              </span>
            </div>
            <img
              src={surferIcon}
              alt=""
              className="size-12 object-contain shrink-0"
            />
          </div>
        </button>

        {/* Time Capsules */}
        <Link
          to="/capsule"
          className="relative rounded-2xl overflow-hidden h-[99px] block hover:opacity-95 transition-opacity col-span-2 lg:col-span-1 border border-[#E3E3E3]"
        >
          <img
            src={timeCapCardBg}
            alt=""
            className="absolute inset-0 object-cover w-full h-full rounded-[16px]"
          />
          <div className="relative flex items-center justify-between h-full px-5">
            <div className="flex flex-col gap-1">
              <span className="font-inter text-[12px] font-normal uppercase tracking-widest text-gray-500/70">
                Time Capsules
              </span>
              <span
                className="font-inter text-[14px] font-semibold leading-tight"
                style={{ color: "#293039" }}
              >
                <span className="font-bold" style={{ color: "#EA580C" }}>
                  {capsuleCount}
                </span>{" "}
                {capsuleCount === 1 ? "post" : "posts"} scheduled
              </span>
            </div>
            <img
              src={hourglassIcon}
              alt=""
              className="size-12 object-contain shrink-0"
            />
          </div>
        </Link>

        {/* Streak Count */}
        <div className="relative rounded-2xl overflow-hidden h-[99px] col-span-2 lg:col-span-1 border border-[#E3E3E3]">
          <img
            src={streakCardBg}
            alt=""
            className="absolute inset-0 object-cover w-full h-full rounded-[16px]"
          />
          <div className="relative flex items-center justify-between h-full px-5">
            <div className="flex flex-col gap-1">
              <span className="font-inter text-[12px] font-normal uppercase tracking-widest text-gray-500">
                Streak Count
              </span>
              <p
                className="font-inter text-[14px] font-semibold leading-tight"
                style={{ color: "#293039" }}
              >
                You're on a{" "}
                <span className="font-bold" style={{ color: "#EA580C" }}>
                  {streakCount}-day
                </span>{" "}
                streak
              </p>
            </div>
            <img
              src={zapIcon}
              alt=""
              className="size-11 object-contain shrink-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
