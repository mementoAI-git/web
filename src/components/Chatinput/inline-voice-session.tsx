import type { VoiceMessage, VoiceRuntime } from "@/features/voice/types";
import { useState } from "react";
import { useSubscription } from "@/contexts/subscription";
import { PricingOverlay } from "@/features/pricing/pricing-overlay";
import { UPGRADE_COPY } from "@/features/pricing/upgrade-copy";
import { FreeVoiceMinutesDialog } from "@/features/pricing/free-voice-minutes-dialog";
import { freeVoiceSecondsLeft } from "@/features/pricing/free-voice-minutes";
import Voiceinput from "./Voiceinput";

export function InlineVoiceSession({ connectionPersonId, memoryId, history = [], variant = "composer", onSessionChange, onRuntime, onMessages, persistent, onEnd }: {
  connectionPersonId?: string;
  memoryId?: string | null;
  variant?: "composer" | "overview" | "floating";
  persistent?: boolean;
  onRuntime?: (runtime: VoiceRuntime | null) => void;
  onMessages?: (messages: VoiceMessage[]) => void;
  history?: { role: "user" | "ai"; text: string }[];
  onEnd: () => void;
  onSessionChange?: (active: boolean) => void;
}) {
  const { summary, isProOrAbove, isLoading } = useSubscription();
  // Free members confirm in a modal first (it shows their minutes left); "upgrade" opens the plans.
  const [step, setStep] = useState<"confirm" | "upgrade" | "talking">("confirm");
  if (isLoading) return <p role="status" className="text-sm text-text-neutral-weak">Preparing voice…</p>;
  if (!isProOrAbove && step !== "talking") {
    const secondsLeft = freeVoiceSecondsLeft(summary);
    // With no free minutes left, go straight to the upgrade flow.
    if (step === "upgrade" || secondsLeft === 0) {
      const usedUp = secondsLeft === 0;
      return (
        <PricingOverlay
          open
          onOpenChange={(open) => !open && onEnd()}
          title={usedUp ? UPGRADE_COPY.voice_mode.title : "Talk without a limit"}
          description={usedUp ? UPGRADE_COPY.voice_mode.description : "Pro includes unlimited voice conversations with Memento."}
          dismissLabel="Let me think about it"
        />
      );
    }
    return (
      <FreeVoiceMinutesDialog
        secondsLeft={secondsLeft}
        onContinue={() => setStep("talking")}
        onUpgrade={() => setStep("upgrade")}
        onClose={onEnd}
      />
    );
  }
  return <Voiceinput connectionPersonId={connectionPersonId} persistent={persistent} onRuntime={onRuntime} onMessages={onMessages} onSessionChange={onSessionChange} inline variant={variant} autoStart onCancel={onEnd} memoryId={memoryId} history={history} />;
}
