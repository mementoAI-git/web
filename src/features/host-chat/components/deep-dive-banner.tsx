import { cn } from "@/utility";

interface DeepDiveBannerProps {
  dimensionLabel: string;
  onExit: () => void;
  className?: string;
}

export function DeepDiveBanner({ dimensionLabel, onExit, className }: DeepDiveBannerProps) {
  return (
    <div
      className={cn(
        "flex w-full max-w-[800px] flex-col gap-3 rounded-2xl border border-v3-brand-strong/35 bg-[color-mix(in_srgb,var(--v3-brand-strong)_8%,white)] px-4 py-3 font-inter sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      role="status"
    >
      <p className="text-sm text-v3-text-strong">
        <span className="font-semibold">Deep dive:</span>{" "}
        <span className="text-v3-text-weak">{dimensionLabel}</span>
      </p>
      <button
        type="button"
        className="shrink-0 rounded-full bg-v3-fill-strong px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        onClick={onExit}
      >
        Exit deep dive
      </button>
    </div>
  );
}
