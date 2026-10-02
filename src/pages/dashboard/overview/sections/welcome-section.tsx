import { Link, useNavigate } from "react-router-dom";
import { useModal } from "@/hooks/use-modal";
import { ChatIcon, PlusIcon } from "@/components/icons";
import { useStore } from "@/hooks/use-store";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import bgCard from "@/assets/icon/folder/empty-get-started.png";
import brightButtonIcon from "@/assets/icon/noto_bright-button.svg";
import moonfaceIcon from "@/assets/icon/moonface.svg";
import zapIcon from "@/assets/icon/zap.svg";
import trophyIcon from "@/assets/icon/noto_trophy.svg";
import enrichmentBgPng from "@/assets/icon/enrichment bg.png";
import {
  getGreetingPunctuation,
  shouldUseBrightWelcomeIcon,
} from "./welcome-section-helpers";
import { Zap } from "lucide-react";
import { cn } from "@/utility";
import { TypographyH1, TypographyH2, TypographyMuted } from "@/components/ui/typography";

const overviewMobileCtaLabel =
  "w-full max-w-[6.25rem] text-center font-inter text-[10px] font-medium leading-tight text-text-neutral-strong line-clamp-3 sm:hidden";

/** Outline CTAs (Quick add, Chat) — shared so hover / motion match. */
const overviewWelcomeSecondaryCtaClassName = cn(
  "flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1.5 transition-colors",
  "sm:h-12 sm:w-auto sm:flex-none sm:flex-row sm:items-center sm:gap-2 sm:rounded-full sm:border sm:border-stroke-neutral-weak sm:bg-white sm:px-5 sm:font-inter sm:text-sm sm:font-medium sm:text-text-neutral-strong sm:hover:bg-fill-neutral-weaker",
);

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
  const navigate = useNavigate();
  const { open } = useModal();
  const greeting = useMemo(() => getGreeting(), []);
  const [useBrightWelcomeIcon, setUseBrightWelcomeIcon] = useState(() =>
    shouldUseBrightWelcomeIcon(),
  );
  useEffect(() => {
    const sync = () => setUseBrightWelcomeIcon(shouldUseBrightWelcomeIcon());
    sync();
    const id = window.setInterval(sync, 60_000);
    return () => window.clearInterval(id);
  }, []);
  const { data: statsData, mutate: mutateUserStats } = useSWR(endpoint.userStats);
  const stats = statsData?.data ?? {};
  const quickPending = Number(stats.quick_capture_pending_count) || 0;
  const quickLatestId =
    typeof stats.quick_capture_latest_id === "string" ?
      stats.quick_capture_latest_id
    : null;

  useEffect(() => {
    if (quickPending <= 0) return;
    const id = window.setInterval(() => {
      void mutateUserStats();
    }, 4000);
    return () => window.clearInterval(id);
  }, [quickPending, mutateUserStats]);
  const streakCount = Number(user?.streak) || Number(stats.streak_count) || 0;
  const enrichmentScore = Number(stats.enrichment_score) || 0;

  return (
    <div className="w-full space-y-6 sm:space-y-8 lg:space-y-10 py-4 sm:py-9 lg:py-12">
      <div className="space-y-2">
        <div className="flex min-w-0 items-start gap-2.5 sm:items-center sm:gap-3">
          <img
            src={useBrightWelcomeIcon ? brightButtonIcon : moonfaceIcon}
            alt=""
            className="size-7 sm:size-10 shrink-0"
          />
          <TypographyH1 className="min-w-0 font-garamond font-normal text-[22px] leading-[1.2] text-text-neutral-strong sm:text-[32px] lg:text-[40px]">
            {greeting}
            {(user?.nickname || user?.first_name || user?.last_name) && (
              <i className="text-text-success-strong">
                {" "}
                {user?.nickname || user?.first_name || user?.last_name}
                {getGreetingPunctuation(greeting)}
              </i>
            )}
          </TypographyH1>
        </div>
      </div>
      <div className="flex flex-col items-stretch gap-5 sm:gap-6 xl:flex-row">
        <div className="relative min-h-[180px] min-w-0 flex-1 overflow-hidden rounded-3xl sm:min-h-[200px]">
          <img
            src={bgCard}
            alt=""
            className="absolute top-0 right-0 left-0 object-cover size-full"
          />
          <div className="absolute left-0 top-0 flex size-full flex-col justify-between p-5 sm:p-7 lg:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <TypographyH2 className="min-w-0 font-garamond text-[20px] font-normal text-text-neutral-strong lg:text-[24px]">
                What’s on your mind today?
              </TypographyH2>
              <div className="flex shrink-0 items-center gap-3">
                <span className="flex items-center gap-1.5 font-inter text-sm font-semibold text-text-neutral-weak">
                  <img src={zapIcon} alt="streak" className="size-5" />
                  {streakCount}
                </span>
                <span className="flex items-center gap-1.5 font-inter text-sm font-semibold text-text-neutral-weak">
                  <img src={trophyIcon} alt="enrichment score" className="size-5" />
                  {enrichmentScore}%
                </span>
              </div>
            </div>
            <div className="flex flex-row items-start justify-center gap-2.5 sm:flex-wrap sm:items-center sm:justify-start sm:gap-3">
              <button
                type="button"
                onClick={() => open("create-memory")}
                className={cn(
                  "flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1.5 transition-opacity hover:opacity-90",
                  "sm:h-12 sm:w-auto sm:flex-none sm:flex-row sm:items-center sm:gap-2 sm:rounded-full sm:bg-v3-brand-strong sm:px-5 sm:text-white",
                )}
              >
                <span className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-v3-brand-strong text-white shadow-sm sm:hidden">
                  <PlusIcon className="size-5" />
                </span>
                <PlusIcon className="hidden size-4 shrink-0 text-white sm:block" />
                <span className="hidden whitespace-nowrap font-inter text-sm font-medium sm:inline">
                  Add story/item
                </span>
                <span className={overviewMobileCtaLabel}>Add story/item</span>
              </button>
              <button
                type="button"
                onClick={() => open("quick-capture")}
                className={overviewWelcomeSecondaryCtaClassName}
              >
                <span className="flex size-[52px] shrink-0 items-center justify-center rounded-full border border-stroke-neutral-weak bg-white text-text-neutral-strong shadow-sm sm:hidden">
                  <Zap className="size-5" strokeWidth={2} aria-hidden />
                </span>
                <Zap
                  className="hidden size-4 shrink-0 sm:block"
                  strokeWidth={2}
                  aria-hidden
                />
                <span className="hidden whitespace-nowrap font-inter text-sm font-medium sm:inline">
                  Quick add
                </span>
                <span className={overviewMobileCtaLabel}>Quick add</span>
              </button>
              <Link to="/chat" className={overviewWelcomeSecondaryCtaClassName}>
                <span className="flex size-[52px] shrink-0 items-center justify-center rounded-full border border-stroke-neutral-weak bg-white text-text-neutral-strong shadow-sm sm:hidden">
                  <ChatIcon className="size-5" />
                </span>
                <ChatIcon className="hidden size-4 shrink-0 sm:block" />
                <span className="hidden whitespace-nowrap font-inter text-sm font-medium sm:inline">
                  Chat
                </span>
                <span className={overviewMobileCtaLabel}>
                  Chat
                </span>
              </Link>
            </div>
          </div>
        </div>
        <div className="relative w-full min-w-0 flex-1 overflow-hidden rounded-3xl xl:max-w-[335px] xl:shrink-0">
          <img
            src={enrichmentBgPng}
            alt=""
            className="absolute inset-0 object-cover w-full h-full"
          />
          <div className="relative flex flex-col justify-between gap-4 p-5 sm:p-6 min-h-[200px]">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="font-garamond font-normal leading-none text-[clamp(2.25rem,10vw,3.75rem)] bg-gradient-to-b from-[#5B9BD5] to-[#A8D4F5] bg-clip-text text-transparent">
                  {enrichmentScore}%
                </span>
                <span className="font-inter text-xs font-normal text-text-neutral-strong bg-white/70 rounded-full px-3 py-1.5 whitespace-nowrap sm:text-sm">
                  Enrichment score
                </span>
              </div>
              <TypographyMuted className="font-inter text-xs leading-relaxed text-text-neutral-weak sm:text-sm">
                Share stories &amp; files to build context. Link apps to enrich
                your Memento.
              </TypographyMuted>
            </div>
            <div className="flex flex-wrap items-stretch gap-2 sm:items-center">
              <button
                type="button"
                onClick={() => open("memory-insights")}
                className="flex min-h-[44px] w-full items-center justify-center rounded-full border border-stroke-neutral-weak bg-transparent px-5 font-inter text-sm font-semibold text-text-neutral-strong transition-colors hover:bg-fill-neutral-weak whitespace-nowrap sm:w-auto sm:min-h-10"
              >
                View insights
              </button>
            </div>
          </div>
        </div>
      </div>

      {quickPending > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (quickLatestId) navigate(`/chat/${quickLatestId}`);
              else navigate("/stories");
            }}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-stroke-neutral-weak bg-fill-neutral-weaker px-4 py-2 font-inter text-sm font-medium text-text-neutral-strong transition-colors hover:bg-fill-neutral-weak sm:w-auto sm:min-h-0"
          >
            <span className="text-text-brand-strong">{quickPending}</span>
            <span>
              {quickPending === 1 ?
                "Quick capture finishing up"
              : `${quickPending} quick captures finishing up`}
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
