import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DeepDiveBannerProps {
  dimensionLabel: string;
  onExit: () => void;
  className?: string;
}

export function DeepDiveBanner({ dimensionLabel, onExit, className }: DeepDiveBannerProps) {
  return (
    <div
      className={cn(
        "flex max-w-full shrink-0 flex-wrap items-center gap-1.5 rounded-2xl border border-stroke-brand-strong/35 bg-fill-brand-weak px-2 py-1.5 shadow-none ring-1 ring-stroke-brand-strong/20 sm:flex-nowrap sm:rounded-full sm:py-1",
        className,
      )}
      role="status"
    >
      <Badge
        variant="secondary"
        className="max-w-[min(40vw,200px)] truncate border-0 bg-fill-neutral-weak px-2 text-[11px] font-medium text-text-neutral-strong"
        title={`Deep dive: ${dimensionLabel}`}
      >
        <span className="text-text-neutral-weaker">Deep dive</span>
        <span className="mx-1 text-text-neutral-weak">·</span>
        <span>{dimensionLabel}</span>
      </Badge>
      <Button
        type="button"
        size="xs"
        variant="outline"
        className="h-7 shrink-0 rounded-full border-stroke-brand-strong/40 bg-bg-raised text-text-neutral-strong hover:bg-fill-neutral-weak"
        onClick={onExit}
      >
        Exit
      </Button>
    </div>
  );
}
