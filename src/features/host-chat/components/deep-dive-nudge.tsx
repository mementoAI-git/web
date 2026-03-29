import { cn } from "@/utility";
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

  return (
    <div
      className={cn(
        "w-full max-w-[800px] rounded-2xl border border-v3-stroke-weak bg-white p-4 font-inter shadow-sm",
        className,
      )}
    >
      <p className="text-sm font-semibold text-v3-text-strong">Go deeper</p>
      <p className="mt-1 text-sm text-v3-text-weak">
        {question ? (
          question
        ) : (
          <>
            Spend a few minutes focused on{" "}
            <span className="font-medium text-v3-text-strong">{label}</span>. You can leave anytime.
          </>
        )}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-full bg-v3-brand-strong px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          onClick={onDeepDive}
        >
          Start deep dive
        </button>
        <button
          type="button"
          className="rounded-full border border-v3-stroke-weak bg-white px-4 py-2 text-sm font-medium text-v3-text-strong transition-colors hover:bg-v3-fill-weaker"
          onClick={onDismiss}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
