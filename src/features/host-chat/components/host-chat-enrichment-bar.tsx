import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CategoryScore } from "@/features/enrichment";

interface HostChatEnrichmentBarProps {
  enrichmentScore: number;
  deltaToday: number;
  /** Per-dimension scores from GET /users/stats (same source as overall score). */
  categoryScores?: CategoryScore[] | null;
  className?: string;
}

function sortCategoriesForFocus(scores: CategoryScore[]): CategoryScore[] {
  const unlocked = scores.filter((c) => c.unlocked).sort((a, b) => a.score - b.score);
  const locked = scores.filter((c) => !c.unlocked);
  return [...unlocked, ...locked];
}

export function HostChatEnrichmentBar({
  enrichmentScore,
  deltaToday,
  categoryScores,
  className,
}: HostChatEnrichmentBarProps) {
  const rows = useMemo(() => {
    if (!categoryScores?.length) return [];
    return sortCategoriesForFocus(categoryScores);
  }, [categoryScores]);

  const hasBreakdown = rows.length > 0;

  const statusLabel =
    hasBreakdown ?
      `Enrichment ${enrichmentScore} percent; ${rows.length} life areas shown below` :
      `Enrichment progress ${enrichmentScore} percent`;

  return (
    <div className={cn("flex w-full min-w-0 shrink-0 flex-col gap-2", className)}>
      <Badge
        variant="outline"
        className="h-5 w-fit shrink-0 border-v3-stroke-weak bg-white/80 px-2 text-[10px] font-semibold uppercase tracking-wide text-v3-text-weaker"
      >
        Enrichment
      </Badge>
      <div
        className={cn(
          "flex w-full min-w-0 flex-col gap-2 border border-v3-stroke-weak bg-v3-fill-weaker/90 px-2.5 py-1.5 shadow-none",
          hasBreakdown ? "rounded-xl" : "rounded-full",
        )}
        role="status"
        aria-label={statusLabel}
      >
        <div className="flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 sm:flex-nowrap">
          <span className="shrink-0 text-sm font-semibold tabular-nums text-v3-text-strong">
            {enrichmentScore}%
          </span>
          <div className="h-1.5 min-w-[40px] flex-1 overflow-hidden rounded-full bg-v3-fill-weak sm:max-w-[72px] sm:flex-initial sm:w-[72px]">
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

      {hasBreakdown ?
        <div className="min-w-0 border-t border-v3-stroke-weak pt-2">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-v3-text-weaker">
            By life area
          </p>
          <ul
            className="flex max-h-[min(40vh,240px)] flex-col gap-2 overflow-y-auto overscroll-contain pr-0.5 [scrollbar-gutter:stable]"
            aria-label="Enrichment percentage by category"
          >
            {rows.map((c) => (
              <li key={c.key} className="min-w-0">
                <div className="mb-0.5 flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      "min-w-0 truncate text-xs leading-tight text-v3-text-strong",
                      !c.unlocked && "text-v3-text-weaker",
                    )}
                    title={c.label}
                  >
                    {c.label}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 tabular-nums text-xs font-medium text-v3-text-strong",
                      !c.unlocked && "font-normal text-v3-text-weaker",
                    )}
                  >
                    {c.unlocked ? `${c.score}%` : "Soon"}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-v3-fill-weak">
                  <div
                    className={cn(
                      "h-full rounded-full bg-v3-brand-strong/90 transition-[width] duration-300",
                      !c.unlocked && "bg-v3-text-disabled",
                    )}
                    style={{
                      width: c.unlocked ? `${Math.min(100, c.score)}%` : "0%",
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      : null}
      </div>
    </div>
  );
}
