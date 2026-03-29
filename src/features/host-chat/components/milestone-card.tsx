import { cn } from "@/utility";

interface MilestoneCardProps {
  /** Score delta since page load; null or 0 hides the card. */
  enrichmentDelta: number | null;
  /** Label of the milestone just reached, if any (e.g. "Life Chronicler"). */
  milestoneLabel?: string | null;
  className?: string;
}

export function MilestoneCard({
  enrichmentDelta,
  milestoneLabel,
  className,
}: MilestoneCardProps) {
  if (enrichmentDelta == null || enrichmentDelta <= 0) return null;

  return (
    <div
      className={cn(
        "w-full max-w-[800px] rounded-2xl border border-v3-stroke-weak bg-v3-fill-weaker px-4 py-3 font-inter",
        className,
      )}
      role="status"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-v3-text-weaker">
        {milestoneLabel ? milestoneLabel : "Milestone"}
      </p>
      <p className="mt-1 text-sm text-v3-text-strong">
        Your Memento grew by{" "}
        <span className="font-semibold text-v3-brand-strong">+{enrichmentDelta}%</span>{" "}
        enrichment this session.
      </p>
    </div>
  );
}
