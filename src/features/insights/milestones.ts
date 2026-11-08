/** Shared with mobile `src/features/insights/milestone-celebrations.ts`; keep the two in step. */
export interface Milestone {
  id: string;
  title: string;
  description: string;
  achieved: boolean;
  progressLabel: string;
}

export interface MilestoneStatsInput {
  memoryCount?: number;
  streakDays?: number;
  capsuleCount?: number;
  beneficiaryCount?: number;
}

const count = (value: unknown) => Math.max(0, Number(value) || 0);

export function calculateMilestones(stats: MilestoneStatsInput): Milestone[] {
  const memories = count(stats.memoryCount);
  const streak = count(stats.streakDays);
  const capsules = count(stats.capsuleCount);
  const beneficiaries = count(stats.beneficiaryCount);

  return [
    {
      id: "first-story",
      title: "First Reflection",
      description: "Preserved your first memory in your personal legacy vault.",
      achieved: memories >= 1,
      progressLabel: memories >= 1 ? "Unlocked" : `${memories} / 1`,
    },
    {
      id: "story-five",
      title: "Archive Keeper",
      description: "Documented 5 meaningful chapters of your journey.",
      achieved: memories >= 5,
      progressLabel: memories >= 5 ? "Unlocked" : `${memories} / 5`,
    },
    {
      id: "streak-seven",
      title: "Reflective Habit",
      description: "Maintained a 7-day continuous reflection streak.",
      achieved: streak >= 7,
      progressLabel: streak >= 7 ? "Unlocked" : `${streak} / 7 days`,
    },
    {
      id: "time-capsule",
      title: "Future Messenger",
      description: "Scheduled your first time capsule for future delivery.",
      achieved: capsules >= 1,
      progressLabel: capsules >= 1 ? "Unlocked" : "0 / 1 capsule",
    },
    {
      id: "legacy-contact",
      title: "Trusted Circle",
      description: "Designated a legacy contact or beneficiary.",
      achieved: beneficiaries >= 1,
      progressLabel: beneficiaries >= 1 ? "Unlocked" : "0 / 1 contact",
    },
  ];
}

/** Capsules that have been sent on their way: scheduled or already delivered. */
export function countSentCapsules(stats: unknown): number {
  const data = (stats ?? {}) as Record<string, unknown>;
  return (
    count(data.scheduled_count ?? data.scheduled) +
    count(data.delivered_count ?? data.delivered)
  );
}

/** Beneficiary lists come back paginated, as a plain list, or as a bare count. */
export function countBeneficiaries(list: unknown): number {
  if (Array.isArray(list)) return list.length;
  const data = (list ?? {}) as { totalDocs?: unknown; docs?: unknown[] };
  if (data.totalDocs != null) return count(data.totalDocs);
  return Array.isArray(data.docs) ? data.docs.length : 0;
}

export function streakMessage(days: number): string {
  if (days >= 21) return "You are a legend. Keep it up!";
  if (days >= 8) return "You are on a roll. Keep it up!";
  if (days === 7) return "A full week. Your story is taking shape!";
  if (days >= 3) return "Great rhythm. Keep it up!";
  if (days >= 1) return "Great start. Come back tomorrow!";
  return "Every story starts somewhere. Save a memory today to begin a streak.";
}
