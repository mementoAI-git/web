"use client";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { useOptionalConversationChrome } from "@/contexts/conversation-chrome";
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

function SpokenRepliesSetting() {
  const spokenReplies = useOptionalConversationChrome()?.spokenReplies;
  if (!spokenReplies) return null;
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h2 id="spoken-replies-label" className="font-geist text-base font-semibold leading-6 text-text-neutral-strong">
          Voice narration
        </h2>
        <p id="spoken-replies-help" className="font-geist text-sm leading-5 text-text-neutral-weak">
          {spokenReplies.supported ? "Read new replies aloud." : "Not available in this browser."}
        </p>
      </div>
      <Switch
        aria-labelledby="spoken-replies-label"
        aria-describedby="spoken-replies-help"
        aria-busy={spokenReplies.isLoading || undefined}
        checked={spokenReplies.enabled}
        disabled={!spokenReplies.supported}
        onCheckedChange={spokenReplies.onToggle}
      />
    </div>
  );
}

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
      <SpokenRepliesSetting />
      <Voices />
      <BackgroundMusic />
    </div>
  );
}
