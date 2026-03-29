import { cn } from "@/utility";

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
        "flex w-full max-w-[800px] flex-col gap-2 rounded-2xl border border-v3-stroke-weak bg-v3-fill-weaker px-4 py-3 font-inter sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-v3-text-weaker">Enrichment</p>
        <div className="mt-1 flex items-center gap-3">
          <span className="text-lg font-semibold text-v3-text-strong tabular-nums">
            {enrichmentScore}%
          </span>
          <div className="h-2 min-w-[120px] flex-1 overflow-hidden rounded-full bg-v3-fill-weak">
            <div
              className="h-full rounded-full bg-v3-brand-strong transition-[width] duration-300"
              style={{ width: `${Math.min(100, enrichmentScore)}%` }}
            />
          </div>
        </div>
      </div>
      <span className="shrink-0 rounded-full bg-v3-fill-weak px-3 py-1 text-xs font-medium text-v3-text-weak">
        {deltaToday > 0 ? `Grew today +${deltaToday}` : "No change today"}
      </span>
    </div>
  );
}
