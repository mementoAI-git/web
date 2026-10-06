/* eslint-disable react-refresh/only-export-components -- hooks exported next to small presentational components */
import { useMemo, type ReactNode } from "react";
import useSWR from "swr";
import { BookOpen, Clock, Star, TrendingUp } from "lucide-react";
import { cn } from "@/utility";
import { useStore } from "@/hooks/use-store";
import endpoint from "@/api/endpoint";
import type { UserStatsData } from "@/features/enrichment/enrichment-api.types";
import { deriveTopCategoryLabel } from "@/features/enrichment/derive-top-category";

/** KPI-style strip (counts, streak, breadth %). Not “insights” in the narrative sense. */
export interface AtAGlanceCardData {
  icon: ReactNode;
  iconBg: string;
  title: string;
  body: ReactNode;
}

export function AtAGlanceCard({ icon, iconBg, title, body }: AtAGlanceCardData) {
  return (
    <div className="flex w-60 min-w-60 sm:w-64 sm:min-w-64 flex-col gap-3 rounded-2xl border border-v3-stroke-weak bg-bg-neutral p-4">
      <div className="flex items-center gap-3">
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", iconBg)}>
          {icon}
        </div>
        <p className="font-inter text-sm font-semibold leading-tight text-v3-text-strong line-clamp-2">{title}</p>
      </div>
      <p className="font-inter text-xs leading-relaxed text-v3-text-weak flex-1">{body}</p>
    </div>
  );
}

/** Activity / counts strip (Settings + modal). SWR dedupes across surfaces. */
export function useAtAGlanceCards(): AtAGlanceCardData[] {
  const { user } = useStore();
  const { data: statsData } = useSWR(endpoint.userStats);
  const { data: memoriesStatsData } = useSWR(endpoint.memoriesStats);

  const statsTyped = statsData?.data as (UserStatsData & { top_dimension?: string | null }) | undefined;
  const topDimension =
    statsTyped?.top_dimension ?? deriveTopCategoryLabel(statsTyped?.category_scores) ?? null;
  const enrichmentScore = Number(statsTyped?.enrichment_score) || 0;
  const streakCount = Number(user?.streak) || Number(statsTyped?.streak_count) || 0;
  const memoriesCount =
    memoriesStatsData?.data?.stories_count ?? memoriesStatsData?.stories_count ?? 0;

  return useMemo(
    () => [
      {
        icon: <Clock size={16} strokeWidth={1.5} className="text-icon-warning-strong" />,
        iconBg: "bg-fill-warning-weak",
        title:
          enrichmentScore > 50 ? "The picture is filling in" : "You're at the beginning of the map",
        body:
          enrichmentScore < 50
            ? "Small additions still change how the story feels when someone opens it later."
            : "There is still room to wander—what you add next will tilt the balance.",
      },
      {
        icon: <TrendingUp size={16} strokeWidth={1.5} className="text-icon-success-strong" />,
        iconBg: "bg-fill-success-weak",
        title: topDimension ? `${topDimension} shows up most often` : "A few corners are still quiet",
        body: topDimension ? (
          <>
            <strong className="font-semibold text-v3-text-strong">{topDimension}</strong> has the most
            entries so far. Other threads may be waiting for a first sentence.
          </>
        ) : (
          "When you touch a new dimension, the shape of the whole story shifts a little."
        ),
      },
      {
        icon: <BookOpen size={16} strokeWidth={1.5} className="text-icon-info-strong" />,
        iconBg: "bg-fill-info-weak",
        title:
          memoriesCount > 0
            ? `${memoriesCount} ${memoriesCount === 1 ? "memory" : "memories"} on the shelf`
            : "Room for a first memory",
        body:
          memoriesCount > 0 ? (
            <>
              <strong className="font-semibold text-v3-text-strong">{memoriesCount}</strong>{" "}
              {memoriesCount === 1 ? "memory" : "memories"} so far—each one is a door someone can open
              later.
            </>
          ) : (
            "One short note is enough to begin; you can always return and deepen it."
          ),
      },
      {
        icon: <Star size={16} strokeWidth={1.5} className="text-icon-brand-strong" />,
        iconBg: "bg-fill-brand-weak",
        title: streakCount > 0 ? `${streakCount} days in a row` : "Streak starts with today",
        body:
          streakCount > 0 ? (
            <>
              <strong className="font-semibold text-v3-text-strong">{streakCount} days</strong> back to
              back—rhythm matters more than length.
            </>
          ) : (
            "Whenever you show up counts; there is no wrong pace."
          ),
      },
    ],
    [enrichmentScore, memoriesCount, streakCount, topDimension],
  );
}
