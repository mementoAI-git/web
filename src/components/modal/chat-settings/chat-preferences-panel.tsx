"use client";

import { cn } from "@/lib/utils";
import BackgroundMusic from "./background-music";
import Voices from "./voices";
import { EnrichmentSummary } from "./enrichment-summary";
import type { CategoryScore } from "@/features/enrichment";
import type { ConversationFilesRequest } from "@/pages/dashboard/chat/conversation/conversation-assets";

type ChatPreferencesPanelProps = {
  className?: string;
  /** Tighter spacing for narrow sidebar vs modal */
  density?: "comfortable" | "compact";
  enrichmentScore?: number;
  categoryScores?: CategoryScore[] | null;
  onOpenConversationFiles?: (request: ConversationFilesRequest) => void;
};

export function ChatPreferencesPanel({
  className,
  density = "comfortable",
  enrichmentScore = 0,
  categoryScores = [],
  onOpenConversationFiles,
}: ChatPreferencesPanelProps) {
  const compact = density === "compact";
  return (
    <div
      className={cn(
        "flex h-full w-full min-h-0 flex-col overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-gutter:stable]",
        compact ? "gap-6 px-0 pb-1" : "gap-6 px-5 py-5 sm:px-6 sm:py-6",
        className,
      )}
    >
      <EnrichmentSummary score={enrichmentScore} categoryScores={categoryScores} onOpenFiles={onOpenConversationFiles} />
      <Voices />
      <BackgroundMusic />
    </div>
  );
}
