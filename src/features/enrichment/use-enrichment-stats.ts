/**
 * Hook for fetching and deriving enrichment stats.
 * Computes daily delta and milestone detection client-side using localStorage.
 */
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import type { UserStatsData } from "./enrichment-api.types";
import type { LifeDimension } from "@/features/host-chat/chat.types";

const BASELINE_KEY = "memento:enrichment:baseline";
const MILESTONE_KEY = "memento:enrichment:lastMilestone";

interface EnrichmentBaseline {
  score: number;
  date: string; // YYYY-MM-DD
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getBaseline(): EnrichmentBaseline | null {
  try {
    const raw = localStorage.getItem(BASELINE_KEY);
    return raw ? (JSON.parse(raw) as EnrichmentBaseline) : null;
  } catch {
    return null;
  }
}

function setBaseline(score: number): void {
  try {
    localStorage.setItem(
      BASELINE_KEY,
      JSON.stringify({ score, date: todayStr() }),
    );
  } catch {
    // ignore storage errors
  }
}

function getLastMilestoneThreshold(): number {
  try {
    const raw = localStorage.getItem(MILESTONE_KEY);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

function setLastMilestoneThreshold(threshold: number): void {
  try {
    localStorage.setItem(MILESTONE_KEY, String(threshold));
  } catch {
    // ignore
  }
}

export interface UseEnrichmentStatsResult {
  stats: UserStatsData | null;
  isLoading: boolean;
  /** Score delta since the start of today (0 if no change yet today). */
  deltaToday: number;
  /** True when the current milestone threshold is newly reached this session. */
  milestoneJustReached: boolean;
  nudgeDimension: LifeDimension | null;
  nudgeQuestion: string | null;
}

export function useEnrichmentStats(): UseEnrichmentStatsResult {
  const { data, isLoading } = useSWR<{ data: UserStatsData }>(endpoint.userStats);
  const stats = data?.data ?? null;

  let deltaToday = 0;
  let milestoneJustReached = false;

  if (stats) {
    const today = todayStr();
    const baseline = getBaseline();

    if (!baseline || baseline.date !== today) {
      // First time today — set baseline, delta is 0
      setBaseline(stats.enrichment_score);
    } else {
      deltaToday = Math.max(0, stats.enrichment_score - baseline.score);
    }

    const lastThreshold = getLastMilestoneThreshold();
    if (stats.milestone.reached_threshold > lastThreshold) {
      milestoneJustReached = true;
      setLastMilestoneThreshold(stats.milestone.reached_threshold);
    }
  }

  const nudgeDimension =
    (stats?.nudge?.category_key as LifeDimension | undefined) ?? null;
  const nudgeQuestion = stats?.nudge?.question ?? null;

  return {
    stats,
    isLoading,
    deltaToday,
    milestoneJustReached,
    nudgeDimension,
    nudgeQuestion,
  };
}
