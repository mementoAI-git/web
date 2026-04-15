import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LifeDimension } from "../chat.types";
import { dimensionLabel } from "../chat.types";

interface DeepDiveNudgeProps {
  dimension: LifeDimension;
  /** Suggested question from the API (nudge.question). Falls back to generic copy if absent. */
  question?: string | null;
  onDeepDive: () => void;
  onDismiss: () => void;
  className?: string;
}

export function DeepDiveNudge({
  dimension,
  question,
  onDeepDive,
  onDismiss,
  className,
}: DeepDiveNudgeProps) {
  const label = dimensionLabel(dimension);
  const hint =
    question ??
    `Try a focused chat on ${label}. You can leave anytime.`;

  return (
    <div
      className={cn(
        "flex max-w-[min(92vw,420px)] shrink-0 items-center gap-2 rounded-full border border-v3-stroke-weak bg-white px-2 py-1 shadow-sm ring-1 ring-v3-stroke-weak/80",
        className,
      )}
    >
      <Badge
        variant="outline"
        className="h-6 shrink-0 border-v3-stroke-weak bg-v3-fill-weaker px-2 text-[10px] font-semibold text-v3-text-strong"
      >
        Go deeper
      </Badge>
      <p
        className="min-w-0 flex-1 truncate text-[11px] leading-tight text-v3-text-weak sm:text-xs"
        title={hint}
      >
        {question ?? `Try a focused chat on ${label}.`}
      </p>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          size="xs"
          className="h-7 rounded-full bg-v3-brand-strong px-2.5 text-[11px] font-medium text-white hover:opacity-90"
          onClick={onDeepDive}
        >
          Start
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="h-7 rounded-full px-2 text-[11px] font-medium text-v3-text-weak hover:bg-v3-fill-weaker hover:text-v3-text-strong"
          onClick={onDismiss}
        >
          Later
        </Button>
      </div>
    </div>
  );
}
