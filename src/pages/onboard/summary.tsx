import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useSWR from "swr";

import { Button } from "@/components/ui/button";
import endpoint from "@/api/endpoint";
import {
  ALL_ENRICHMENT_CATEGORY_KEYS,
  enrichmentCategoryLabel,
} from "@/features/enrichment/enrichment-categories";
import type { UserStatsData } from "@/features/enrichment/enrichment-api.types";

import {
  buildPersonalizedHostStarter,
  clearOnboardingSummarySnapshot,
  getPostOnboardingDestination,
  readOnboardingSummarySnapshot,
} from "./summary-helpers";

export default function OnboardingSummaryPage() {
  const navigate = useNavigate();
  const snapshot = useMemo(() => readOnboardingSummarySnapshot(), []);
  const { data, isLoading } = useSWR<{ data: UserStatsData }>(endpoint.userStats);

  const stats = data?.data ?? null;
  const enrichmentScore = Math.round(Number(stats?.enrichment_score) || 0);
  const nextDestination = getPostOnboardingDestination(
    snapshot?.nextAction ?? "dashboard",
  );
  const touched = new Set(snapshot?.touchedCategories ?? []);
  const hostStarter = buildPersonalizedHostStarter(snapshot);

  const handleContinue = () => {
    clearOnboardingSummarySnapshot();
    navigate(nextDestination.path, nextDestination.state ? { state: nextDestination.state } : undefined);
  };

  const handleStartHostChat = () => {
    clearOnboardingSummarySnapshot();
    const search = new URLSearchParams({ starter: hostStarter }).toString();
    navigate(`/chat?${search}`);
  };

  return (
    <div className="flex flex-col gap-8 py-4 sm:py-8">
      <section className="space-y-4 text-center">
        <span className="inline-flex rounded-full bg-v3-fill-weaker px-4 py-1.5 font-inter text-xs font-semibold uppercase tracking-[0.18em] text-v3-text-weaker">
          Great start
        </span>
        <div className="space-y-3">
          <h1 className="font-garamond text-[34px] font-normal leading-tight text-v3-text-strong sm:text-[44px]">
            {snapshot?.nickname ? `${snapshot.nickname}, your Memento is taking shape.` : "Your Memento is taking shape."}
          </h1>
          <p className="mx-auto max-w-[540px] font-inter text-sm leading-6 text-v3-text-weak sm:text-base">
            {isLoading
              ? "We’re pulling in your first enrichment snapshot now."
              : `You’re already at ${enrichmentScore}% enrichment just by introducing yourself. This is the start of the picture, not the whole frame.`}
          </p>
        </div>
      </section>

      <section className="rounded-[28px] border border-v3-stroke-weak bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="font-inter text-[11px] font-semibold uppercase tracking-[0.18em] text-v3-text-weaker">
              Unexplored territory
            </p>
            <h2 className="font-garamond text-2xl font-normal text-v3-text-strong sm:text-[30px]">
              What onboarding already touched
            </h2>
          </div>
          <p className="font-inter text-sm text-v3-text-weak">
            Covered areas are lit up. The rest are invitations for later.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {ALL_ENRICHMENT_CATEGORY_KEYS.map((key) => {
            const isTouched = touched.has(key);
            return (
              <div
                key={key}
                className={[
                  "rounded-2xl border p-4 transition-colors",
                  isTouched
                    ? "border-v3-brand-strong bg-v3-fill-weaker"
                    : "border-v3-stroke-weak bg-v3-fill-weak",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-inter text-sm font-semibold text-v3-text-strong">
                      {enrichmentCategoryLabel(key)}
                    </p>
                    <p className="font-inter text-xs text-v3-text-weak">
                      {isTouched ? "Touched in onboarding" : "Unexplored territory"}
                    </p>
                  </div>
                  <span
                    className={[
                      "inline-flex rounded-full px-2.5 py-1 font-inter text-[11px] font-semibold",
                      isTouched
                        ? "bg-v3-brand-strong text-white"
                        : "bg-white text-v3-text-weaker",
                    ].join(" ")}
                  >
                    {isTouched ? "Started" : "Open"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          type="button"
          onClick={handleStartHostChat}
          className="rounded-full bg-v3-brand-strong px-7 py-6 font-inter text-sm font-semibold text-white hover:bg-v3-fill-strong"
        >
          Talk with Memento
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleContinue}
          className="rounded-full border-v3-stroke-weak px-7 py-6 font-inter text-sm font-semibold text-v3-text-strong"
        >
          {nextDestination.label}
        </Button>
      </div>
    </div>
  );
}
