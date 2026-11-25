import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useStore } from "@/hooks/use-store";
import { isOnboardingComplete } from "@/features/onboarding-groot/onboarding-status";
import type { UserStatsData } from "@/features/enrichment/enrichment-api.types";
import {
  calculateMilestones,
  countBeneficiaries,
  countSentCapsules,
  orderMilestones,
} from "./milestones";
import { VoiceMinutesCards } from "./voice-minutes-cards";

/** Same key as the memory forms, so the list is shared rather than fetched twice. */
const BENEFICIARIES_KEY = `${endpoint.beneficiaries}?page=1&limit=100`;

/** The milestones reached along the way. Matches mobile `MilestonesPanel.tsx`. */
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
  const milestones = orderMilestones(
    calculateMilestones({
      onboardingComplete: isOnboardingComplete(user),
      memoryCount:
        Number(
          memories.data?.data?.stories_count ??
            memories.data?.stories_count ??
            data?.stories_count,
        ) || 0,
      reflectionCount: Number(data?.reflections_count) || 0,
      streakDays: Number(user?.streak) || Number(data?.streak_count) || 0,
      enrichmentScore: Number(data?.enrichment_score) || 0,
      capsuleCount: countSentCapsules(capsules.data?.data),
      beneficiaryCount: countBeneficiaries(beneficiaries.data?.data),
    }),
  );

  return (
    <div className="insights-list">
      {/* Voice mode minutes: this month (resets on the 1st) and all time. */}
      <VoiceMinutesCards />
    <ul className="insights-list" aria-label="Milestones">
      {milestones.map((milestone) => (
        <li
          key={milestone.id}
          className="insights-card insights-milestone"
          data-achieved={milestone.achieved || undefined}
          data-unavailable={!milestone.available || undefined}
          aria-disabled={!milestone.available || undefined}
        >
          <span className="insights-milestone-mark" aria-hidden>
            {milestone.achieved && <Check className="size-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-inter text-base font-medium text-text-neutral-strong">
              {milestone.href ? (
                // Stretches over the whole card in CSS.
                <Link to={milestone.href} className="insights-milestone-open">
                  {milestone.title}
                </Link>
              ) : (
                milestone.title
              )}
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
