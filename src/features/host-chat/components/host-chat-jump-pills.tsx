import { cn } from "@/utility";
import { formatJumpMonthLabel } from "../month-navigation";

interface HostChatJumpPillsProps {
  monthKeys: string[];
  onJump: (yyyyMm: string) => void;
  className?: string;
}

export function HostChatJumpPills({ monthKeys, onJump, className }: HostChatJumpPillsProps) {
  if (monthKeys.length === 0) return null;

  return (
    <div
      className={cn(
        "flex w-full max-w-[800px] flex-wrap gap-2 font-inter",
        className,
      )}
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
