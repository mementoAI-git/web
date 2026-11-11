"use client";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useOptionalConversationChrome } from "@/contexts/conversation-chrome";
import BackgroundMusic from "./background-music";
import Voices from "./voices";
import { RecordConversationsSetting } from "@/components/Chatinput/record-conversations-setting";
import { EnrichmentSummary } from "./enrichment-summary";
import { chatSettingsCard } from "./chat-settings-card";
import type { ConversationFilesRequest } from "@/pages/dashboard/chat/conversation/conversation-assets";

type ChatPreferencesPanelProps = {
  className?: string;
  /** Tighter spacing for narrow sidebar vs modal */
  density?: "comfortable" | "compact";
  enrichmentScore?: number;
  onOpenConversationFiles?: (request: ConversationFilesRequest) => void;
  conversationFileCount?: number;
};

function SpokenRepliesSetting() {
  const spokenReplies = useOptionalConversationChrome()?.spokenReplies;
  if (!spokenReplies) return null;
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h3 id="spoken-replies-label" className="font-geist text-sm font-medium leading-5 text-text-neutral-strong">
          Voice narration
        </h3>
        <p id="spoken-replies-help" className="font-geist text-sm leading-5 text-text-neutral-weaker">
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
  enrichmentScore,
  onOpenConversationFiles,
  conversationFileCount,
}: ChatPreferencesPanelProps) {
  const compact = density === "compact";
  return (
    <div
      className={cn(
        // Body text is SF Pro Rounded; the font tokens are rebound for children that name one.
        "flex h-full w-full min-h-0 flex-col font-rounded [--font-geist:var(--font-rounded)] [--font-inter:var(--font-rounded)] overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-hide",
        compact ? "gap-6 px-0 pb-1" : "gap-6 px-5 py-5 sm:px-6 sm:py-6",
        className,
      )}
    >
      <EnrichmentSummary score={enrichmentScore} onOpenFiles={onOpenConversationFiles} fileCount={conversationFileCount} />
      <Separator className="h-px bg-stroke-neutral-weak" />
      <section className="flex flex-col gap-3">
        <h2 className="font-geist text-base font-semibold leading-6 text-text-neutral-strong">AI Voice</h2>
        <div data-testid="ai-voice-card" className={cn("flex flex-col gap-3", chatSettingsCard)}>
          <SpokenRepliesSetting />
          <RecordConversationsSetting />
          <Voices />
        </div>
      </section>
      <Separator className="h-px bg-stroke-neutral-weak" />
      <BackgroundMusic />
    </div>
  );
}
