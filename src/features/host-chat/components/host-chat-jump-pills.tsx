import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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

const chipClass =
  "h-6 shrink-0 cursor-pointer border-v3-stroke-weak bg-white px-2 text-[10px] font-medium text-v3-text-strong hover:bg-v3-fill-weaker sm:h-7 sm:px-2.5 sm:text-[11px]";

export function HostChatJumpPills({
  monthKeys,
  onJump,
  categoryPills = [],
  onCategoryPill,
  className,
}: HostChatJumpPillsProps) {
  if (monthKeys.length > 0) {
    return (
      <div
        className={cn(
          "flex min-w-0 shrink-0 flex-nowrap items-center gap-1 sm:gap-1.5",
          className,
        )}
        role="navigation"
        aria-label="Jump to month"
      >
        {monthKeys.map((k) => (
          <Badge key={k} variant="outline" asChild className={cn(chipClass, "rounded-full")}>
            <button type="button" onClick={() => onJump(k)}>
              {formatJumpMonthLabel(k)}
            </button>
          </Badge>
        ))}
      </div>
    );
  }

  if (categoryPills.length === 0 || !onCategoryPill) return null;

  return (
    <div
      className={cn(
        "flex min-w-0 shrink-0 flex-nowrap items-center gap-1 sm:gap-1.5",
        className,
      )}
      role="navigation"
      aria-label="Start a topic"
    >
      {categoryPills.map((pill) => (
        <Badge
          key={pill.category_key}
          variant="outline"
          asChild
          className={cn(
            chipClass,
            "max-w-[min(100%,min(220px,calc(100vw-3rem)))] truncate rounded-full",
          )}
          title={pill.starter}
        >
          <button type="button" onClick={() => onCategoryPill(pill.starter)}>
            {pill.starter}
          </button>
        </Badge>
      ))}
    </div>
  );
}
