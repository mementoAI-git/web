import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

type StoriesActionButtonsProps = {
  onViewInsights: () => void;
  onCreateMemory: () => void;
  onQuickCapture: () => void;
  compactInNav?: boolean;
};

export function StoriesActionButtons({
  onViewInsights,
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
          className="h-full rounded-[8px] border border-v3-stroke-weak bg-white px-4 font-inter text-sm font-medium text-v3-text-strong hover:bg-v3-fill-weaker"
        >
          <Zap className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          <span className="whitespace-nowrap">Quick add</span>
        </Button>
        <Button
          onClick={onCreateMemory}
          className="h-full rounded-[8px] bg-v3-brand-strong px-4 font-inter text-sm font-medium text-white hover:bg-v3-brand-strong/90"
        >
          <PlusIcon className="size-4 shrink-0 text-white" />
          <span className="whitespace-nowrap">Add memory</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid w-full grid-cols-2 gap-2 shrink-0 sm:flex sm:w-auto sm:flex-nowrap sm:items-center sm:gap-3">
      <Button
        onClick={onCreateMemory}
        className={cn(
          "col-span-2 flex h-11 items-center justify-center gap-2 rounded-[16px] bg-v3-brand-strong px-4 font-inter text-sm font-semibold text-white hover:opacity-90 sm:col-span-1 sm:h-12 sm:rounded-full sm:px-5",
        )}
      >
        <PlusIcon className="size-4 shrink-0" />
        <span className="whitespace-nowrap">Add memory</span>
      </Button>
      <Button
        variant="outline"
        onClick={onViewInsights}
        className="h-10 rounded-[16px] border-v3-stroke-weak bg-v3-fill-weaker px-3 font-inter text-xs font-semibold text-v3-text-strong hover:bg-v3-fill-weak sm:h-12 sm:rounded-full sm:px-5 sm:text-sm"
      >
        View insights
      </Button>
      <Button
        variant="outline"
        onClick={onQuickCapture}
        className="h-10 rounded-[16px] border-v3-stroke-weak bg-v3-fill-weaker px-3 font-inter text-xs font-semibold text-v3-text-strong hover:bg-v3-fill-weak sm:h-12 sm:rounded-full sm:px-5 sm:text-sm"
      >
        Quick add
      </Button>
    </div>
  );
}
