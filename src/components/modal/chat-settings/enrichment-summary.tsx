import { ChevronRight, Image } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { chatSettingsCard } from "./chat-settings-card";
import type { ConversationFilesRequest } from "@/pages/dashboard/chat/conversation/conversation-assets";

function enrichmentStrength(score: number) {
  if (score >= 70) return "Strong";
  if (score >= 35) return "Medium";
  return "Weak";
}

/** The mobile home page's Enrichment score card, on a neutral fill, showing a word rather than a number. */
export function EnrichmentSummary({
  score,
  onOpenFiles,
  fileCount,
}: {
  /** Left out until it's known, rather than showing a number that may be wrong. */
  score?: number;
  onOpenFiles?: (request: ConversationFilesRequest) => void;
  /** Left out until it's known, rather than showing a number that may be low. */
  fileCount?: number;
}) {
  const navigate = useNavigate();
  const strength = score === undefined ? "–" : enrichmentStrength(score);

  return (
    <div className="flex flex-col gap-4">
      <section className={`flex flex-col gap-3 ${chatSettingsCard}`}>
        <div className="flex items-center justify-between gap-3">
          <h2 aria-label={`Enrichment score: ${strength}`} className="min-w-0 flex-1 text-base font-semibold text-text-neutral-strong">{strength}</h2>
          <button
            type="button"
            onClick={() => navigate("/insights", { state: { section: "enrichment" } })}
            className="h-8 shrink-0 cursor-pointer rounded-full bg-fill-neutral-strong px-3 text-sm font-medium text-text-inverse-strong transition-opacity hover:opacity-90 dark:bg-white dark:text-[rgba(23,11,0,0.9)]"
          >
            View Insight
          </button>
        </div>
        <p className="text-sm leading-5 text-text-neutral-weaker">
          Your Enrichment score reflects your memory health across 10 key life areas.
        </p>
      </section>

      <button
        type="button"
        onClick={() => onOpenFiles?.({ tab: "media" })}
        className="flex w-full cursor-pointer items-center gap-3 rounded-[12px] bg-fill-neutral-weaker p-3 justify-start text-left font-geist text-sm font-medium text-text-neutral-strong transition-[transform,background-color] duration-150 hover:bg-fill-neutral-weak active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        <Image className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
        <span className="min-w-0 flex-1 text-left">Shared media &amp; links{fileCount === undefined ? "" : ` (${fileCount})`}</span>
        <ChevronRight className="ml-auto size-5 shrink-0 text-icon-neutral-weak" aria-hidden />
      </button>
    </div>
  );
}
