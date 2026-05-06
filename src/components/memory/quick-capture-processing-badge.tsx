import { cn } from "@/utility";
import type { IMemory } from "@/utility/interface";

function shouldShowPendingEnrichment(memory: IMemory): boolean {
  if (memory.enrichment_status !== "pending") return false;
  return (
    memory.capture_source === "quick" ||
    memory.prompt_type === "static" ||
    memory.prompt_type === "ai-generated"
  );
}

type BadgeVariant = "inline" | "overlay";

/** Shown while quick capture / daily-prompt reflections are still being enriched (title/tags) on the server. */
export function QuickCaptureProcessingBadge({
  memory,
  className,
  variant = "inline",
}: {
  memory: IMemory;
  className?: string;
  variant?: BadgeVariant;
}) {
  if (!shouldShowPendingEnrichment(memory)) {
    return null;
  }
  return (
    <span
      className={cn(
        "shrink-0 rounded-full bg-fill-brand-weak px-2 py-0.5 font-inter text-[10px] font-semibold uppercase tracking-wide text-text-brand-strong",
        variant === "overlay" &&
          "pointer-events-none absolute left-2 top-2 z-10 shadow-sm ring-1 ring-black/5",
        className,
      )}
    >
      In progress
    </span>
  );
}
