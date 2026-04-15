import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HostChatEnrichmentBarProps {
  enrichmentScore: number;
  deltaToday: number;
  className?: string;
}

export function HostChatEnrichmentBar({
  enrichmentScore,
  deltaToday,
  className,
}: HostChatEnrichmentBarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-full border border-v3-stroke-weak bg-v3-fill-weaker/90 px-2.5 py-1 shadow-none",
        className,
      )}
      role="status"
      aria-label="Enrichment progress"
    >
      <Badge
        variant="outline"
        className="h-5 border-v3-stroke-weak bg-white/80 px-2 text-[10px] font-semibold uppercase tracking-wide text-v3-text-weaker"
      >
        Enrichment
      </Badge>
      <span className="text-sm font-semibold tabular-nums text-v3-text-strong">
        {enrichmentScore}%
      </span>
      <div className="h-1.5 w-[56px] shrink-0 overflow-hidden rounded-full bg-v3-fill-weak sm:w-[72px]">
        <div
          className="h-full rounded-full bg-v3-brand-strong transition-[width] duration-300"
          style={{ width: `${Math.min(100, enrichmentScore)}%` }}
        />
      </div>
      <Badge
        variant="secondary"
        className="h-5 shrink-0 border-0 bg-v3-fill-weak px-2 text-[10px] font-medium text-v3-text-weak"
      >
        {deltaToday > 0 ? `Today +${deltaToday}` : "No change today"}
      </Badge>
    </div>
  );
}
