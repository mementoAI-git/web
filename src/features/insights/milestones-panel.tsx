import { Check, Flame } from "lucide-react";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useStore } from "@/hooks/use-store";
import type { UserStatsData } from "@/features/enrichment/enrichment-api.types";
import {
  calculateMilestones,
  countBeneficiaries,
  countSentCapsules,
  streakMessage,
} from "./milestones";

/** Same key as the memory forms, so the list is shared rather than fetched twice. */
const BENEFICIARIES_KEY = `${endpoint.beneficiaries}?page=1&limit=100`;

/** The current streak and the milestones reached along the way. */
export function MilestonesPanel() {
  const { user } = useStore();
  const stats = useSWR<{ data: UserStatsData }>(endpoint.userStats);
  const memories = useSWR(endpoint.memoriesStats);
  const capsules = useSWR(endpoint.capsuleStats);
  const beneficiaries = useSWR(BENEFICIARIES_KEY);

  if (stats.error && !stats.data)
    return (
      <div className="insights-empty">
        <p>Couldn’t load your milestones.</p>
        <Button variant="outline" onClick={() => void stats.mutate()}>
          Retry milestones
        </Button>
      </div>
    );
  if (stats.isLoading && !stats.data)
    return (
      <div className="insights-empty" role="status">
        <Spinner />
        Loading your milestones…
      </div>
    );

  const data = stats.data?.data;
  const streak = Number(user?.streak) || Number(data?.streak_count) || 0;
  const milestones = calculateMilestones({
    memoryCount:
      memories.data?.data?.stories_count ??
      memories.data?.stories_count ??
      data?.stories_count,
    streakDays: streak,
    capsuleCount: countSentCapsules(capsules.data?.data),
    beneficiaryCount: countBeneficiaries(beneficiaries.data?.data),
  });
  const reached = milestones.filter((milestone) => milestone.achieved).length;

  return (
    <div className="insights-list">
      <section aria-label="Current streak" className="insights-card insights-streak">
        <span className="insights-streak-icon" aria-hidden>
          <Flame className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-inter text-sm text-text-neutral-weak">Current streak</p>
          <p className="mt-1 font-inter text-2xl font-semibold text-text-neutral-strong tabular-nums">
            {streak} {streak === 1 ? "day" : "days"}
          </p>
          <p className="mt-1 font-inter text-sm text-text-neutral-weak">
            {streakMessage(streak)}
          </p>
        </div>
      </section>
      <div className="flex items-center justify-between gap-3 pt-2">
        <h3 className="font-inter text-base font-medium text-text-neutral-strong">
          Milestones
        </h3>
        <span className="font-inter text-sm text-text-neutral-weak tabular-nums">
          {reached} of {milestones.length} reached
        </span>
      </div>
      <ul className="insights-list" aria-label="Milestones">
        {milestones.map((milestone) => (
          <li
            key={milestone.id}
            className="insights-card insights-milestone"
            data-achieved={milestone.achieved || undefined}
          >
            <span className="insights-milestone-mark" aria-hidden>
              {milestone.achieved && <Check className="size-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-inter text-base font-medium text-text-neutral-strong">
                {milestone.title}
              </p>
              <p className="mt-1 font-inter text-sm text-text-neutral-weak">
                {milestone.description}
              </p>
            </div>
            <span className="insights-milestone-progress font-inter text-xs tabular-nums">
              {milestone.progressLabel}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
