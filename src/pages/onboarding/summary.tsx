import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useSWR from "swr";

import endpoint from "@/api/endpoint";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ALL_ENRICHMENT_CATEGORY_KEYS,
  enrichmentCategoryLabel,
} from "@/features/enrichment/enrichment-categories";
import type { UserStatsData } from "@/features/enrichment/enrichment-api.types";
import { cn } from "@/lib/utils";

import {
  buildPersonalizedHostStarter,
  clearOnboardingSummarySnapshot,
  getPostOnboardingDestination,
  readOnboardingSummarySnapshot,
} from "./summary-helpers";

const revealClass =
  "motion-safe:animate-fade-in-up motion-safe:[animation-fill-mode:both]";

function EditorialCard({
  className,
  eyebrow,
  title,
  body,
  children,
  delayMs,
}: {
  className?: string;
  eyebrow: string;
  title: string;
  body: string;
  children?: React.ReactNode;
  delayMs: number;
}) {
  return (
    <article
      className={cn(
        revealClass,
        "group relative overflow-hidden rounded-[28px] border border-v3-stroke-weak bg-white/90 p-4 shadow-[0_18px_60px_rgba(44,31,21,0.05)] sm:p-5",
        className,
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.95),transparent_45%),radial-gradient(circle_at_70%_85%,rgba(200,149,108,0.12),transparent_40%),linear-gradient(180deg,rgba(247,244,239,0.95),rgba(255,255,255,0.9))]"
      />
      <div className="relative flex min-h-[15rem] flex-col justify-between gap-5 rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.48),rgba(255,255,255,0.18))] p-4 backdrop-blur-[6px] sm:min-h-[18rem] lg:min-h-[21rem]">
        <div className="space-y-3">
          <p className="font-inter text-[11px] font-medium uppercase tracking-[0.16em] text-v3-text-weaker">
            {eyebrow}
          </p>
          {children}
        </div>
        <div className="space-y-2">
          <p className="font-inter text-sm font-semibold text-v3-text-strong">
            {title}
          </p>
          <p className="font-inter text-sm leading-6 text-v3-text-weak">
            {body}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function OnboardingSummaryPage() {
  const navigate = useNavigate();
  const snapshot = useMemo(() => readOnboardingSummarySnapshot(), []);
  const { data, isLoading } = useSWR<{ data: UserStatsData }>(endpoint.userStats);

  const stats = data?.data ?? null;
  const enrichmentScore = Math.round(Number(stats?.enrichment_score) || 0);
  const nextDestination = getPostOnboardingDestination(
    snapshot?.nextAction ?? "dashboard",
  );
  const touchedKeys = ALL_ENRICHMENT_CATEGORY_KEYS.filter((key) =>
    new Set(snapshot?.touchedCategories ?? []).has(key),
  );
  const untouchedKeys = ALL_ENRICHMENT_CATEGORY_KEYS.filter(
    (key) => !new Set(snapshot?.touchedCategories ?? []).has(key),
  );
  const hostStarter = buildPersonalizedHostStarter(snapshot);
  const alternateNextLabel =
    nextDestination.path !== "/overview" || nextDestination.label !== "Go to dashboard"
      ? nextDestination.label
      : null;

  const primaryTouched = touchedKeys.slice(0, 3);

  const handleContinueToDashboard = () => {
    clearOnboardingSummarySnapshot();
    navigate("/overview");
  };

  const handleContinue = () => {
    clearOnboardingSummarySnapshot();
    navigate(
      nextDestination.path,
      nextDestination.state ? { state: nextDestination.state } : undefined,
    );
  };

  const handleStartHostChat = () => {
    clearOnboardingSummarySnapshot();
    const search = new URLSearchParams({ starter: hostStarter }).toString();
    navigate(`/chat?${search}`);
  };

  return (
    <div className="flex flex-col gap-8 py-2 sm:gap-10 lg:grid lg:h-[calc(100dvh-11rem)] lg:grid-cols-[minmax(0,1fr)_minmax(760px,980px)] lg:gap-16 lg:overflow-hidden">
      <aside className="flex flex-col gap-5 lg:min-w-0 lg:justify-between lg:pt-14 lg:pr-10">
        <div className="space-y-3">
          <p className="font-inter text-[11px] font-medium uppercase tracking-[0.16em] text-v3-text-weaker">
            First reflection
          </p>
          <p className="max-w-[20ch] font-garamond text-[1.7rem] leading-[1.06] text-v3-text-strong">
            A private place to begin.
          </p>
          <p className="max-w-[34ch] font-inter text-sm leading-6 text-v3-text-weak">
            Take your time. Nothing here needs to be finished all at once.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleContinueToDashboard}
          className="w-full rounded-full border-v3-stroke-weak bg-white text-v3-text-strong transition-transform duration-150 ease-out active:scale-[0.97] sm:w-fit sm:min-w-[190px]"
        >
          Go to dashboard
        </Button>
      </aside>

      <div className="min-h-0 min-w-0 lg:overflow-y-auto lg:pr-2">
        <div className="flex flex-col gap-8 pb-8 lg:gap-14 lg:pb-14">
          <section
            className={cn(revealClass, "space-y-6 pt-2 lg:pt-14")}
            style={{ animationDelay: "40ms" }}
          >
            <Separator className="bg-v3-stroke-weak/70" />
            <div className="space-y-4">
              <h1 className="max-w-[15ch] font-garamond text-[2rem] leading-[1.05] text-v3-text-strong sm:text-[2.7rem] lg:text-[4rem]">
                {snapshot?.nickname
                  ? `${snapshot.nickname}, you have already started shaping the story only you can tell.`
                  : "You have already started shaping the story only you can tell."}
              </h1>
              <p className="max-w-[55ch] font-inter text-[15px] leading-7 text-v3-text-weak sm:text-base">
                {isLoading
                  ? "We’re gathering the first outline of your Memento now."
                  : `You have already filled in ${enrichmentScore}% of your Memento just by introducing yourself.`}
              </p>
            </div>
          </section>

          <section className="grid gap-4 sm:gap-5 xl:grid-cols-3">
            <EditorialCard
              eyebrow="First measure"
              title="A quiet first outline"
              body="This is not the whole story. It is simply enough shape for Memento to begin with care."
              delayMs={120}
            >
              <div className="space-y-2">
                <p className="font-garamond text-[4rem] leading-none text-v3-text-strong sm:text-[4.8rem]">
                  {enrichmentScore}
                  <span className="ml-1 text-[1.8rem] text-v3-text-weaker">%</span>
                </p>
                <p className="max-w-[18ch] font-inter text-sm leading-6 text-v3-text-weak">
                  Already filled in just by introducing yourself.
                </p>
              </div>
            </EditorialCard>

            <EditorialCard
              eyebrow="Themes already touched"
              title="The first parts of your map"
              body="These are the areas already beginning to take shape."
              delayMs={170}
            >
              <div className="space-y-2.5">
                {primaryTouched.map((key) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-full bg-white/70 px-3 py-2 backdrop-blur-sm"
                  >
                    <span className="font-inter text-sm text-v3-text-strong">
                      {enrichmentCategoryLabel(key)}
                    </span>
                    <span className="size-2 rounded-full bg-v3-brand-strong" aria-hidden />
                  </div>
                ))}
              </div>
            </EditorialCard>

            <EditorialCard
              eyebrow="What happens next"
              title="Keep going softly from here"
              body="Let Memento meet you with a gentle first question shaped by what you have already shared."
              delayMs={220}
            >
              <div className="flex h-full items-start">
                <Button
                  type="button"
                  size="lg"
                  onClick={handleStartHostChat}
                  className="w-full rounded-full px-6 text-sm font-semibold transition-transform duration-150 ease-out active:scale-[0.97] sm:w-auto"
                >
                  Talk with Memento
                </Button>
              </div>
            </EditorialCard>
          </section>

          <section
            className={cn(
              revealClass,
              "flex flex-col gap-4 border-t border-v3-stroke-weak/70 pt-8 sm:flex-row sm:items-start sm:justify-between",
            )}
            style={{ animationDelay: "280ms" }}
          >
            <p className="max-w-[40ch] font-garamond text-[1.45rem] leading-tight text-v3-text-strong sm:text-[1.7rem]">
              Other parts of your story can wait until you are ready.
            </p>
            <div className="max-w-[42rem] space-y-3">
              <p className="break-words font-inter text-sm leading-6 text-v3-text-weak">
                Still quiet for now: {untouchedKeys.map(enrichmentCategoryLabel).join(", ").toLowerCase()}.
              </p>
              {alternateNextLabel ? (
                <button
                  type="button"
                  onClick={handleContinue}
                  className="rounded text-sm font-medium text-v3-brand-strong transition-colors hover:text-v3-fill-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-brand-strong focus-visible:ring-offset-2"
                >
                  {alternateNextLabel}
                </button>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
