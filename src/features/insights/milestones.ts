/** Ported from mobile `src/features/insights/milestone-celebrations.ts`; keep the two in step. */

/** The account figures milestones are measured against. */
export type MilestoneMetric = "onboarding" | "stories" | "reflections" | "streak" | "enrichment" | "beneficiaries" | "capsules";

export interface Milestone {
  id: string;
  title: string;
  description: string;
  achieved: boolean;
  /** "Unlocked", "Not yet", or a count such as "3 / 7 days". */
  progressLabel: string;
  /** Multi-step goals not yet reached: 0–1, to put the closest first. */
  progress?: number;
  /** False while the feature behind it is unavailable: shown dimmed, not counted. */
  available: boolean;
  /** Where to go to reach it, offered while it is not yet reached. */
  href?: string;
}

/** Time capsules are paused for now, so Future Messenger can’t be reached. */
export const TIME_CAPSULES_AVAILABLE = false;

/** Enrichment reads "Strong" from 70 (mobile `features/overview/enrichment-strength.ts`). */
export const STRONG_ENRICHMENT_SCORE = 70;

interface MilestoneDefinition {
  id: string;
  title: string;
  description: string;
  metric: MilestoneMetric;
  target: number;
  /** Count label for multi-step goals; one-step goals read "Not yet" until reached. */
  unit?: (target: number) => string;
  available?: boolean;
  href?: string;
}

/**
 * The milestone catalogue. Adding one is a row here plus, if it is new, its
 * metric in `MilestoneStatsInput` (see mobile docs/milestones-plan.md).
 */
export const MILESTONE_CATALOGUE: readonly MilestoneDefinition[] = [
  { id: "onboarding", title: "Complete onboarding", description: "Told Memento about yourself so it can shape your prompts.", metric: "onboarding", target: 1, href: "/onboarding" },
  { id: "first-story", title: "First Story", description: "Saved your first story to your archive.", metric: "stories", target: 1 },
  { id: "stories-ten", title: "Archive Keeper", description: "Saved 10 stories from your life.", metric: "stories", target: 10, unit: (target) => `${target} stories` },
  { id: "stories-twenty", title: "Storyteller", description: "Saved 20 stories from your life.", metric: "stories", target: 20, unit: (target) => `${target} stories` },
  { id: "first-reflection", title: "First Reflection", description: "Answered your first reflection.", metric: "reflections", target: 1 },
  { id: "streak-seven", title: "Reflective Habit", description: "Kept a 7-day reflection streak.", metric: "streak", target: 7, unit: (target) => `${target} days` },
  { id: "streak-thirty", title: "Monthly Rhythm", description: "Kept a 30-day reflection streak.", metric: "streak", target: 30, unit: (target) => `${target} days` },
  { id: "enrichment-strong", title: "Well Known", description: "Your enrichment score reached Strong.", metric: "enrichment", target: STRONG_ENRICHMENT_SCORE },
  { id: "legacy-contact", title: "Trusted Circle", description: "Named a legacy contact or beneficiary.", metric: "beneficiaries", target: 1 },
  { id: "time-capsule", title: "Future Messenger", description: "Scheduled your first time capsule.", metric: "capsules", target: 1, available: TIME_CAPSULES_AVAILABLE },
];

export interface MilestoneStatsInput {
  onboardingComplete?: boolean;
  memoryCount?: number;
  reflectionCount?: number;
  streakDays?: number;
  capsuleCount?: number;
  enrichmentScore?: number;
  beneficiaryCount?: number;
}

function metricValue(stats: MilestoneStatsInput, metric: MilestoneMetric): number {
  const values: Record<MilestoneMetric, number | undefined> = {
    onboarding: stats.onboardingComplete ? 1 : 0,
    stories: stats.memoryCount,
    reflections: stats.reflectionCount,
    streak: stats.streakDays,
    enrichment: stats.enrichmentScore,
    beneficiaries: stats.beneficiaryCount,
    capsules: stats.capsuleCount,
  };
  return Math.max(0, Number(values[metric]) || 0);
}

/** Every milestone, in catalogue order, measured against the account’s figures. */
export function calculateMilestones(stats: MilestoneStatsInput): Milestone[] {
  return MILESTONE_CATALOGUE.map((definition) => {
    const available = definition.available ?? true;
    const current = metricValue(stats, definition.metric);
    const achieved = available && current >= definition.target;
    const counted = Boolean(definition.unit) && available && !achieved;
    return {
      id: definition.id,
      title: definition.title,
      description: definition.description,
      achieved,
      available,
      progressLabel: !available
        ? "Coming soon"
        : achieved
          ? "Unlocked"
          : definition.href
            ? "Start"
            : counted
            ? `${Math.min(current, definition.target)} / ${definition.unit!(definition.target)}`
            : "Not yet",
      progress: counted ? Math.min(1, current / definition.target) : undefined,
      href: available && !achieved ? definition.href : undefined,
    };
  });
}

/**
 * What’s next first: unreached milestones with an action to take, then other
 * unreached ones, closest to done first (catalogue order breaks ties), then
 * those reached, then those unavailable.
 */
export function orderMilestones(milestones: Milestone[]): Milestone[] {
  const rank = (milestone: Milestone) =>
    !milestone.available ? 3 : milestone.achieved ? 2 : milestone.href ? 0 : 1;
  return milestones
    .map((milestone, index) => ({ milestone, index }))
    .sort((a, b) =>
      rank(a.milestone) - rank(b.milestone)
      || (rank(a.milestone) === 1 ? (b.milestone.progress ?? 0) - (a.milestone.progress ?? 0) : 0)
      || a.index - b.index)
    .map(({ milestone }) => milestone);
}

const count = (value: unknown) => Math.max(0, Number(value) || 0);

/** Capsules that have been sent on their way: scheduled or already delivered. */
export function countSentCapsules(stats: unknown): number {
  const data = (stats ?? {}) as Record<string, unknown>;
  return count(data.scheduled_count ?? data.scheduled) + count(data.delivered_count ?? data.delivered);
}

/** Beneficiary lists come back paginated, as a plain list, or with only a total. */
export function countBeneficiaries(list: unknown): number {
  if (Array.isArray(list)) return list.length;
  const data = (list ?? {}) as { totalDocs?: unknown; docs?: unknown[] };
  if (data.totalDocs != null) return count(data.totalDocs);
  return Array.isArray(data.docs) ? data.docs.length : 0;
}
