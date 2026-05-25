import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useSWR from "swr";
import { ArrowUpRight, CircleCheck, MessageSquarePlus, Plus } from "lucide-react";

import endpoint from "@/api/endpoint";
import { Button } from "@/components/ui/button";
import {
  ALL_ENRICHMENT_CATEGORY_KEYS,
  enrichmentCategoryLabel,
} from "@/features/enrichment/enrichment-categories";
import type { UserStatsData } from "@/features/enrichment/enrichment-api.types";
import { cn } from "@/lib/utils";
import bannerCardImage from "@/assets/image/onboarding/L0tgw.png";
import bannerBoatImage from "@/assets/image/onboarding/RIDg6.png";

import {
  buildPersonalizedHostStarter,
  clearOnboardingSummarySnapshot,
  readOnboardingSummarySnapshot,
} from "./summary-helpers";

const cardGradient =
  "bg-[linear-gradient(133deg,rgba(251,210,148,0.14)_0%,rgba(255,252,247,0.45)_56%,rgba(224,229,255,0.88)_100%)]";

function CoverageBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-[rgba(23,11,0,0.1)] bg-[rgba(23,11,0,0.02)] px-2 py-0.5 font-inter text-[12px] leading-5 text-[rgba(23,11,0,0.72)]">
      <CircleCheck className="size-3.5 text-[#6BAF92]" />
      {label}
    </span>
  );
}

function SummaryCard({
  eyebrow,
  footer,
  children,
  className,
}: {
  eyebrow: string;
  footer: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "flex h-[328px] flex-col justify-between rounded-2xl border border-[rgba(23,11,0,0.06)] p-6",
        cardGradient,
        className,
      )}
    >
      <div className="space-y-3">
        <p className="font-inter text-[11px] uppercase tracking-[0.08em] text-[rgba(23,11,0,0.45)]">
          {eyebrow}
        </p>
        {children}
      </div>
      <p className="font-geist text-sm leading-6 text-[rgba(30,30,30,0.9)]">{footer}</p>
    </article>
  );
}

function SummaryBannerActions({
  onChat,
  onAddStory,
  compact = false,
}: {
  onChat: () => void;
  onAddStory: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 self-center",
        compact && "w-full flex-col sm:flex-row lg:w-auto",
      )}
    >
      <Button
        type="button"
        onClick={onChat}
        variant="outline"
        className={cn(
          "h-12 rounded-[999px] border-[rgba(23,11,0,0.08)] bg-white font-inter text-[15px] font-medium text-[rgba(23,11,0,0.88)] shadow-none transition-[transform,background-color,border-color] duration-150 ease-out hover:border-[rgba(23,11,0,0.14)] hover:bg-[rgba(255,255,255,0.96)] active:scale-[0.98]",
          compact ? "w-full sm:w-[92px] lg:w-[92px]" : "w-[92px]",
        )}
      >
        <MessageSquarePlus className="mr-1 size-4" />
        Chat
      </Button>
      <Button
        type="button"
        onClick={onAddStory}
        className={cn(
          "h-12 rounded-[999px] border-0 bg-[#FF6B0A] font-inter text-[15px] font-medium text-white shadow-none transition-[transform,opacity] duration-150 ease-out hover:opacity-95 active:scale-[0.98]",
          compact ? "w-full sm:w-[127px] lg:w-[127px]" : "w-[127px]",
        )}
      >
        <Plus className="mr-1 size-4" />
        Add a story
      </Button>
    </div>
  );
}

function SummaryBannerContent({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-4",
        compact && "items-start",
      )}
    >
      <img
        src={bannerBoatImage}
        alt=""
        className={cn("shrink-0 object-contain", compact ? "size-16 md:size-[72px]" : "size-20")}
      />
      <div className={cn("min-w-0 space-y-1", compact ? "max-w-none" : "max-w-[363px]")}>
        <h3
          className={cn(
            "font-inter font-bold text-[rgba(23,11,0,0.9)]",
            compact ? "text-lg leading-6 md:text-[19px] md:leading-7" : "text-xl leading-7",
          )}
        >
          Continue building your profile.
        </h3>
        <p className="font-geist text-[13px] leading-5 text-[rgba(30,30,30,0.9)]">
          Add memories and stories, and start a conversation to create a deeper, richer Memento profile.
        </p>
      </div>
    </div>
  );
}

function SummaryBanner({
  onChat,
  onAddStory,
}: {
  onChat: () => void;
  onAddStory: () => void;
}) {
  return (
    <section className="relative w-full max-w-[870px] self-start overflow-hidden rounded-2xl lg:h-[112px]">
      <img
        src={bannerCardImage}
        alt=""
        className="absolute inset-0 h-full w-full object-fill"
      />
      <div className="relative flex min-h-[168px] flex-col justify-between gap-4 p-4 sm:min-h-[176px] sm:p-5 md:min-h-[184px] md:p-6 lg:h-full lg:min-h-0 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-6 lg:py-4">
        <div className="flex min-h-0 flex-1 flex-col justify-between gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <SummaryBannerContent compact />
          <SummaryBannerActions
            compact
            onChat={onChat}
            onAddStory={onAddStory}
          />
        </div>
      </div>
    </section>
  );
}

export default function OnboardingSummaryPage() {
  const navigate = useNavigate();
  const snapshot = useMemo(() => readOnboardingSummarySnapshot(), []);
  const { data, isLoading } = useSWR<{ data: UserStatsData }>(endpoint.userStats);

  const stats = data?.data ?? null;
  const enrichmentScore = Math.round(Number(stats?.enrichment_score) || 0);
  const touchedFromSnapshot = snapshot?.touchedCategories ?? [];
  const touchedFromStats =
    stats?.category_scores
      ?.filter((category) => category.itemCount > 0 || category.score > 0)
      .map((category) => category.key) ?? [];
  const touchedSet = new Set(
    touchedFromSnapshot.length > 0 ? touchedFromSnapshot : touchedFromStats,
  );
  const touchedKeys = ALL_ENRICHMENT_CATEGORY_KEYS.filter((key) => touchedSet.has(key));
  const untouchedKeys = ALL_ENRICHMENT_CATEGORY_KEYS.filter((key) => !touchedSet.has(key));
  const hostStarter = buildPersonalizedHostStarter(snapshot);

  const coveredLabels = touchedKeys.map(enrichmentCategoryLabel);
  const quietLabels = untouchedKeys.map(enrichmentCategoryLabel);

  const handleContinueToDashboard = () => {
    clearOnboardingSummarySnapshot();
    navigate("/overview");
  };

  const handleAddStory = () => {
    clearOnboardingSummarySnapshot();
    navigate("/overview", { state: { openModal: "create-memory" } });
  };

  const handleStartHostChat = () => {
    clearOnboardingSummarySnapshot();
    const search = new URLSearchParams({ starter: hostStarter }).toString();
    navigate(`/chat?${search}`);
  };

  return (
    <div className="relative flex min-h-full flex-col bg-white lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[clamp(260px,28vw,401px)_minmax(0,1fr)] lg:overflow-hidden">
      <aside className="relative z-10 hidden flex-col justify-between gap-8 border-b border-[rgba(23,11,0,0.08)] bg-transparent px-5 py-5 md:px-8 md:py-6 lg:flex lg:h-full lg:gap-10 lg:border-r lg:border-b-0 lg:px-10 lg:py-10">
        <div className="max-w-[170px] space-y-4">
          <h2 className="font-garamond text-[20px] leading-6 text-[rgba(23,11,0,0.9)]">
            Reflect, quietly
          </h2>
          <p className="font-inter text-sm leading-5 text-[rgba(30,30,30,0.9)]">
            Take your time. Nothing here needs to be finished all at once.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleContinueToDashboard}
          className="h-11 w-full rounded-full border-[rgba(23,11,0,0.1)] bg-white px-5 font-inter text-sm font-semibold text-[#101828] shadow-none transition-[transform,background-color] duration-150 ease-out hover:bg-[rgba(23,11,0,0.03)] active:scale-[0.98] sm:w-fit"
        >
          Go to Dashboard
          <ArrowUpRight className="ml-1 size-4 text-[rgba(23,11,0,0.45)]" />
        </Button>
      </aside>

      <main className="relative z-10 min-h-0 bg-transparent lg:overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[1041px] flex-col gap-6 px-5 py-6 md:px-8 md:py-8 lg:min-h-full lg:gap-8 lg:px-10 lg:py-10 xl:px-[84px]">
          <section className="space-y-4">
            <h1 className="font-garamond text-[28px] font-medium leading-[1.14] text-[rgba(23,11,0,0.9)] sm:text-[32px] sm:leading-[1.18]">
              Your Memento profile is shaping up
            </h1>
            <p className="max-w-[710px] font-inter text-sm leading-5 text-[rgba(30,30,30,0.9)]">
              {isLoading
                ? "We’re gathering the first outline of your Memento now."
                : "A first outline is already here. You can keep building it at your own pace."}
            </p>
          </section>

          <div className="h-px w-full bg-[rgba(23,11,0,0.1)]" />

          <section className="grid gap-3 xl:grid-cols-2">
            <SummaryCard
              eyebrow="Your Enrichment Score"
              footer="Not the whole story, but really strong for a start."
              className="min-h-[240px] md:min-h-[260px] xl:h-[328px]"
            >
              <div className="space-y-2">
                <p className="font-garamond text-[60px] leading-none tracking-[-0.5px] text-[#FAAE44] sm:text-[72px]">
                  {enrichmentScore}%
                </p>
              </div>
            </SummaryCard>

            <SummaryCard
              eyebrow="Enrichment fields covered"
              className="min-h-[240px] md:min-h-[260px] xl:h-[328px]"
              footer={
                coveredLabels.length > 0
                  ? "So far, your story is already opening around who you are, the memories you carry, the people around you, and where you come from."
                  : "No enrichment fields have been touched yet. Your first stories and reflections will start shaping them."
              }
            >
              {coveredLabels.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {coveredLabels.map((label) => (
                    <CoverageBadge key={label} label={label} />
                  ))}
                </div>
              ) : (
                <p className="max-w-[28ch] font-inter text-sm leading-6 text-[rgba(23,11,0,0.55)]">
                  Nothing has been covered yet.
                </p>
              )}
            </SummaryCard>
          </section>

          <section>
            <p className="max-w-[704px] font-inter text-sm leading-5 text-[rgba(30,30,30,0.9)]">
              You’ve began filling up an important metric we like to call the “Enrichment Score”. Your Enrichment
              score is decided across 10 different fields that cover different aspects of the human life, and continues
              to increase as you reflect and add more information to your Memento.
            </p>
          </section>

          <div className="h-px w-full bg-[rgba(23,11,0,0.1)]" />

          <section className="space-y-3">
            <p className="font-inter text-sm leading-5 text-[rgba(23,11,0,0.65)]">Still quiet for now:</p>
            <p className="max-w-[700px] font-inter text-sm leading-5 text-[rgba(30,30,30,0.9)]">
              {quietLabels.join(", ")}.
            </p>
          </section>

          <SummaryBanner
            onChat={handleStartHostChat}
            onAddStory={handleAddStory}
          />

          <section className="flex flex-col gap-3 rounded-xl bg-[rgba(23,11,0,0.04)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <CircleCheck className="size-4 text-[rgba(6,122,87,0.8)]" />
              <p className="font-inter text-sm leading-5 text-[rgba(30,30,30,0.9)]">
                Your data is private, encrypted, and securely stored and certified on AWS and GCP S3 buckets.
              </p>
            </div>
            <a
              href="https://mymemento.io/legal-pages/privacy"
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit shrink-0 self-start whitespace-nowrap cursor-pointer items-center gap-1 font-geist text-xs font-medium text-[rgba(23,11,0,0.65)] transition-colors duration-150 ease-out hover:text-[rgba(23,11,0,0.9)] sm:self-auto"
            >
              Learn more
              <ArrowUpRight className="size-3.5" />
            </a>
          </section>

          <section className="space-y-4 border-t border-[rgba(23,11,0,0.08)] pt-6 lg:hidden">
            <div className="space-y-3">
              <h2 className="font-garamond text-[20px] leading-6 text-[rgba(23,11,0,0.9)]">
                Reflect, quietly
              </h2>
              <p className="max-w-[26rem] font-inter text-sm leading-5 text-[rgba(30,30,30,0.9)]">
                Take your time. Nothing here needs to be finished all at once.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleContinueToDashboard}
              className="h-11 w-full rounded-full border-[rgba(23,11,0,0.1)] bg-white px-5 font-inter text-sm font-semibold text-[#101828] shadow-none transition-[transform,background-color] duration-150 ease-out hover:bg-[rgba(23,11,0,0.03)] active:scale-[0.98] sm:w-fit"
            >
              Go to Dashboard
              <ArrowUpRight className="ml-1 size-4 text-[rgba(23,11,0,0.45)]" />
            </Button>
          </section>
        </div>
      </main>
    </div>
  );
}
