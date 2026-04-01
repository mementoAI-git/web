import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    <Badge
      variant="secondary"
      className={cn(
        "h-auto max-w-[min(85vw,280px)] shrink-0 whitespace-normal rounded-full border-0 bg-v3-fill-weaker px-2.5 py-1.5 text-left text-[11px] font-medium leading-snug text-v3-text-strong",
        className,
      )}
      role="status"
    >
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-v3-text-weaker">
        {milestoneLabel ? milestoneLabel : "Milestone"}
      </span>
      <span className="mt-0.5 block text-v3-text-weak">
        Memento{" "}
        <span className="font-semibold text-v3-brand-strong">+{enrichmentDelta}%</span>{" "}
        this session.
      </span>
    </Badge>
  );
}
