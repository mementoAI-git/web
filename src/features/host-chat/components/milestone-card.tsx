import { cn } from "@/utility";

interface MilestoneCardProps {
  /** When API returns enrichment delta after a message; null hides the card. */
  enrichmentDelta: number | null;
  className?: string;
}

/**
 * Shown when the server signals a meaningful enrichment jump (stub until API exists).
 */
export function MilestoneCard({ enrichmentDelta, className }: MilestoneCardProps) {
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
        Milestone
      </p>
      <p className="mt-1 text-sm text-v3-text-strong">
        Your Memento grew by{" "}
        <span className="font-semibold text-v3-brand-strong">+{enrichmentDelta}%</span>{" "}
        enrichment this exchange.
      </p>
    </div>
  );
}
