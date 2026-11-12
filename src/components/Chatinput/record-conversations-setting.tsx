import { useId } from "react";
import { Switch } from "@/components/ui/switch";
import { useRecordConversations } from "@/features/voice/recording/preference";

/**
 * "Record conversations", as in the mobile app's chat and call settings.
 * It applies from the next call; one in progress keeps recording (or not).
 */
export function RecordConversationsSetting() {
  const { enabled, setEnabled, userKey } = useRecordConversations();
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h3 id={`${id}-label`} className="font-geist text-sm font-medium leading-5 text-text-neutral-strong">
          Record conversations
        </h3>
        <p id={`${id}-help`} className="font-geist text-sm leading-5 text-text-neutral-weaker">
          Save each conversation to Stories with its audio.
        </p>
      </div>
      <Switch
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-help`}
        checked={enabled}
        disabled={!userKey}
        onCheckedChange={setEnabled}
      />
    </div>
  );
}
