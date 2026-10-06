import type { VoiceMessage, VoiceRuntime } from "@/features/voice/types";
import { useSubscription } from "@/contexts/subscription";
import { UpgradePrompt } from "@/features/pricing/upgrade-prompt";
import { Button } from "@/components/ui/button";
import Voiceinput from "./Voiceinput";

export function InlineVoiceSession({ memoryId, history = [], variant = "composer", onSessionChange, onRuntime, onMessages, persistent, onEnd }: {
  memoryId?: string | null;
  variant?: "composer" | "overview" | "floating";
  persistent?: boolean;
  onRuntime?: (runtime: VoiceRuntime | null) => void;
  onMessages?: (messages: VoiceMessage[]) => void;
  history?: { role: "user" | "ai"; text: string }[];
  onEnd: () => void;
  onSessionChange?: (active: boolean) => void;
}) {
  const { canAccess, isLoading } = useSubscription();
  if (isLoading) return <p role="status" className="text-sm text-text-neutral-weak">Preparing voice…</p>;
  if (!canAccess("voice_mode")) return (
    <div className="flex flex-col gap-3">
      <UpgradePrompt feature="voice_mode" variant="inline" />
      <Button variant="ghost" onClick={onEnd}>Back</Button>
    </div>
  );
  return <Voiceinput persistent={persistent} onRuntime={onRuntime} onMessages={onMessages} onSessionChange={onSessionChange} inline variant={variant} autoStart onCancel={onEnd} memoryId={memoryId} history={history} />;
}
