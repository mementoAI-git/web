import { cn } from "@/utility";
import { formatJumpMonthLabel } from "../month-navigation";
import type { JumpPill } from "@/features/enrichment/enrichment-api.types";

interface HostChatJumpPillsProps {
  monthKeys: string[];
  onJump: (yyyyMm: string) => void;
  /** Category starter pills — shown only when no month history exists yet. */
  categoryPills?: JumpPill[];
  onCategoryPill?: (starter: string) => void;
  className?: string;
}

export function HostChatJumpPills({
  monthKeys,
  onJump,
  categoryPills = [],
  onCategoryPill,
  className,
}: HostChatJumpPillsProps) {
  // Month navigation takes priority once conversation has history
  if (monthKeys.length > 0) {
    return (
      <div
        className={cn("flex w-full max-w-[800px] flex-wrap gap-2 font-inter", className)}
        role="navigation"
        aria-label="Jump to month"
      >
        {monthKeys.map((k) => (
          <button
            key={k}
            type="button"
            className="min-h-8 rounded-full border border-v3-stroke-weak bg-white px-3 text-xs font-medium text-v3-text-strong transition-colors hover:bg-v3-fill-weaker"
            onClick={() => onJump(k)}
          >
            {formatJumpMonthLabel(k)}
          </button>
        ))}
      </div>
    );
  }

  // Category starter pills shown on fresh/empty conversation
  if (categoryPills.length === 0 || !onCategoryPill) return null;

  return (
    <div
      className={cn("flex w-full max-w-[800px] flex-wrap gap-2 font-inter", className)}
      role="navigation"
      aria-label="Start a topic"
    >
      {categoryPills.map((pill) => (
        <button
          key={pill.category_key}
          type="button"
          className="min-h-8 rounded-full border border-v3-stroke-weak bg-white px-3 text-xs font-medium text-v3-text-strong transition-colors hover:bg-v3-fill-weaker"
          onClick={() => onCategoryPill(pill.starter)}
        >
          {pill.starter}
        </button>
      ))}
    </div>
  );
}
