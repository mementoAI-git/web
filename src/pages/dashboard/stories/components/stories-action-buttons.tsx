import { Button } from "@/components/ui/button";
import { SquarePen, Zap } from "lucide-react";

type StoriesActionButtonsProps = {
  onCreateMemory: () => void;
  onQuickCapture: () => void;
  compactInNav?: boolean;
};

export function StoriesActionButtons({
  onCreateMemory,
  onQuickCapture,
  compactInNav = false,
}: StoriesActionButtonsProps) {
  if (compactInNav) {
    return (
      <div className="hidden h-full items-stretch gap-2 xl:flex">
        <Button
          variant="ghost"
          onClick={onQuickCapture}
          className="h-full rounded-full border border-v3-stroke-weak bg-background px-4 font-inter text-sm font-medium text-v3-text-strong hover:bg-v3-fill-weaker"
        >
          <Zap className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          <span className="whitespace-nowrap">Quick add</span>
        </Button>
        <Button
          onClick={onCreateMemory}
          className="h-full rounded-full bg-v3-brand-strong px-4 font-inter text-sm font-medium text-white hover:bg-v3-brand-strong/90"
        >
          <SquarePen className="size-4 shrink-0 text-white" aria-hidden />
          <span className="whitespace-nowrap">Write</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid w-full grid-cols-2 gap-2 shrink-0 sm:flex sm:w-auto sm:flex-nowrap sm:items-center sm:gap-3">
      <Button
        onClick={onCreateMemory}
        className="flex h-11 items-center justify-center gap-2 rounded-[16px] bg-v3-brand-strong px-4 font-inter text-sm font-semibold text-white hover:opacity-90 sm:h-12 sm:rounded-full sm:px-5"
      >
        <SquarePen className="size-4 shrink-0" aria-hidden />
        <span className="whitespace-nowrap">Write</span>
      </Button>
      <Button
        variant="outline"
        onClick={onQuickCapture}
        className="h-11 rounded-[16px] border-v3-stroke-weak bg-v3-fill-weaker px-3 font-inter text-sm font-semibold text-v3-text-strong hover:bg-v3-fill-weak sm:h-12 sm:rounded-full sm:px-5"
      >
        Quick add
      </Button>
    </div>
  );
}
