import useSWR from "swr";
import endpoint from "@/api/endpoint";
import { useStore } from "@/hooks/use-store";
import type { UserStatsData } from "@/features/enrichment/enrichment-api.types";
import { deriveTopCategoryLabel } from "@/features/enrichment/derive-top-category";

function enrichmentLabel(score: number): string {
  if (score <= 0) return "Not started yet";
  if (score < 26) return "Just getting started";
  if (score < 51) return "Building momentum";
  if (score < 76) return "Good progress";
  if (score < 91) return "Nearly complete";
  return "Fully enriched";
}

export function MemoryStatistics() {
  const { user } = useStore();
  const { data: statsData } = useSWR(endpoint.userStats);
  const { data: memoriesStatsData } = useSWR(endpoint.memoriesStats);
  const statsTyped = statsData?.data as
    | (UserStatsData & { top_dimension?: string | null })
    | undefined;
  const enrichmentScore = Math.min(
    100,
    Math.max(0, Number(statsTyped?.enrichment_score) || 0),
  );
  const streakCount =
    Number(user?.streak) || Number(statsTyped?.streak_count) || 0;
  const memoriesCount =
    memoriesStatsData?.data?.stories_count ??
    memoriesStatsData?.stories_count ??
    0;
  const topDimension =
    statsTyped?.top_dimension ??
    deriveTopCategoryLabel(statsTyped?.category_scores) ??
    null;

  return (
    <section
      aria-label="Memory statistics"
      className="grid grid-cols-2 gap-6 sm:grid-cols-4"
    >
      <div className="flex flex-col gap-3">
        <span className="font-inter text-xs text-v3-text-weaker">
          Enrichment score
        </span>
        <span className="font-garamond text-[2rem] font-normal leading-none text-v3-text-strong tabular-nums">
          {enrichmentScore}%
        </span>
        <div className="flex flex-col gap-1.5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-v3-fill-weak">
            <div
              className="h-full rounded-full bg-v3-brand-strong transition-[width] duration-500"
              style={{ width: `${enrichmentScore}%` }}
            />
          </div>
          <span className="font-inter text-xs text-v3-text-weaker">
            {enrichmentLabel(enrichmentScore)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="font-inter text-xs text-v3-text-weaker">
          Memories captured
        </span>
        <span className="font-garamond text-[2rem] font-normal leading-none text-v3-text-strong tabular-nums">
          {memoriesCount}
        </span>
        <span className="font-inter text-xs text-v3-text-weaker">
          Across all dimensions
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <span className="font-inter text-xs text-v3-text-weaker">
          Active streak
        </span>
        <span className="font-garamond text-[2rem] font-normal leading-none text-v3-text-strong tabular-nums">
          {streakCount}
        </span>
        <span className="font-inter text-xs text-v3-text-weaker">
          days in a row
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <span className="font-inter text-xs text-v3-text-weaker">
          Top dimension
        </span>
        <span className="font-garamond text-xl font-normal leading-tight text-v3-text-strong line-clamp-2">
          {topDimension ?? "—"}
        </span>
        <span className="font-inter text-xs text-v3-text-weaker">
          Most entries logged
        </span>
      </div>
    </section>
  );
}
