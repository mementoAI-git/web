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
        "flex shrink-0 items-center gap-2 rounded-full border border-v3-brand-strong/35 bg-[color-mix(in_srgb,var(--v3-brand-strong)_10%,white)] px-2 py-1 shadow-none ring-1 ring-v3-brand-strong/20",
        className,
      )}
      role="status"
    >
      <Badge
        variant="secondary"
        className="max-w-[min(40vw,200px)] truncate border-0 bg-white/70 px-2 text-[11px] font-medium text-v3-text-strong"
        title={`Deep dive: ${dimensionLabel}`}
      >
        <span className="text-v3-text-weaker">Deep dive</span>
        <span className="mx-1 text-v3-text-weak">·</span>
        <span>{dimensionLabel}</span>
      </Badge>
      <Button
        type="button"
        size="xs"
        variant="outline"
        className="h-7 shrink-0 rounded-full border-v3-brand-strong/40 bg-white/90 text-v3-text-strong hover:bg-white"
        onClick={onExit}
      >
        Exit
      </Button>
    </div>
  );
}
