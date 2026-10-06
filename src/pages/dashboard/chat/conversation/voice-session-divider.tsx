import { PhoneCall, PhoneOff } from "lucide-react";
import type { IMessage } from "@/utility/interface";

export interface VoiceSessionEvent {
  id: string;
  active: boolean;
  afterMessage: Partial<IMessage> | null;
}

export function VoiceSessionDivider({ active }: { active: boolean }) {
  const label = active ? "Voice conversation started" : "Voice conversation ended";
  const Icon = active ? PhoneCall : PhoneOff;
  return (
    <div role="separator" aria-label={label} className="flex items-center gap-3 py-2 text-text-neutral-weaker">
      <span aria-hidden className="h-px flex-1 bg-stroke-neutral-weak" />
      <span className="flex items-center gap-2 text-center font-geist text-xs">
        <Icon aria-hidden className="size-3.5 shrink-0" />
        {label}
      </span>
      <span aria-hidden className="h-px flex-1 bg-stroke-neutral-weak" />
    </div>
  );
}
