import { cn } from "@/utility";
import { HOST_CHAT_ENRICHMENT_STUB_PERCENT } from "../chat.types";

interface HostChatEnrichmentBarProps {
  className?: string;
}

/**
 * Stub enrichment UI — replace with API-driven values when backend is ready.
 */
export function HostChatEnrichmentBar({ className }: HostChatEnrichmentBarProps) {
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
            {HOST_CHAT_ENRICHMENT_STUB_PERCENT}%
          </span>
          <div className="h-2 min-w-[120px] flex-1 overflow-hidden rounded-full bg-v3-fill-weak">
            <div
              className="h-full rounded-full bg-v3-brand-strong transition-[width] duration-300"
              style={{ width: `${HOST_CHAT_ENRICHMENT_STUB_PERCENT}%` }}
            />
          </div>
        </div>
      </div>
      <span className="shrink-0 rounded-full bg-v3-fill-weak px-3 py-1 text-xs font-medium text-v3-text-weak">
        {/* TODO: wire enrichment delta from API */}
        Grew today +0
      </span>
    </div>
  );
}
