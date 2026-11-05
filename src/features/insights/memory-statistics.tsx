import useSWR from "swr";
import endpoint from "@/api/endpoint";
import { useStore } from "@/hooks/use-store";
import type { UserStatsData } from "@/features/enrichment/enrichment-api.types";
import { Button } from "@/components/ui/button";

export function MemoryStatistics() {
  const { user } = useStore();
  const {
    data: statsData,
    error,
    isLoading,
    mutate,
  } = useSWR(endpoint.userStats);
  const { data: memoriesStatsData } = useSWR(endpoint.memoriesStats);
  const stats = statsData?.data as UserStatsData | undefined;
  const score = Math.min(
    100,
    Math.max(0, Number(stats?.enrichment_score) || 0),
  );
  const metrics = [
    {
      value:
        memoriesStatsData?.data?.stories_count ??
        memoriesStatsData?.stories_count ??
        stats?.stories_count ??
        0,
      label: "Memories saved",
    },
    { value: stats?.reflections_count ?? 0, label: "Reflections replied" },
    {
      value: Number(user?.streak) || Number(stats?.streak_count) || 0,
      label: "Current streak",
    },
    {
      value:
        score >= 75
          ? "Strong"
          : score >= 50
            ? "Growing"
            : score > 0
              ? "Building"
              : "Getting started",
      label: "Enrichment score",
    },
  ];
  return (
    <section
      aria-label="Memory statistics"
      className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
    >
      {metrics.map((metric) => (
        <div key={metric.label} className="insights-stat">
          <span className="font-inter text-xl font-medium text-text-neutral-strong tabular-nums">
            {error ? "—" : isLoading && !stats ? "…" : metric.value}
          </span>
          <span className="font-inter text-xs text-text-neutral-weak sm:text-sm">
            {metric.label}
          </span>
        </div>
      ))}
      {error && (
        <Button variant="outline" onClick={() => void mutate()}>
          Retry statistics
        </Button>
      )}
    </section>
  );
}
