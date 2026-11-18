import { FormDialog } from "@/components/modal/form-dialog";
import { Button } from "@/components/ui/button";
import { describeFreeVoiceMinutes } from "./free-voice-minutes";

/**
 * Shown to free members before a voice call: how many free minutes are left,
 * with the choice to carry on or upgrade to Pro for unlimited voice. Uses the
 * shared modal layout, so phones get the standard bottom sheet: full height,
 * actions at the bottom, the primary one full width and 56px tall.
 */
export function FreeVoiceMinutesDialog({
  secondsLeft,
  onContinue,
  onUpgrade,
  onClose,
}: {
  secondsLeft: number | null;
  onContinue: () => void;
  onUpgrade: () => void;
  onClose: () => void;
}) {
  const description = `${describeFreeVoiceMinutes(secondsLeft)} Upgrade to Pro to talk without a limit.`;
  return (
    <FormDialog title="Voice mode is free to try" description={description} onClose={onClose}>
      <p className="mb-8 text-base leading-6 text-text-neutral-weak">{description}</p>
      <div className="form-dialog-footer flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onUpgrade}
          className="h-14 w-full rounded-full border-stroke-neutral-weak bg-transparent px-7 text-base font-semibold text-text-neutral-strong sm:h-12 sm:w-auto"
        >
          Upgrade to Pro
        </Button>
        <Button
          type="button"
          onClick={onContinue}
          className="h-14 w-full rounded-full px-7 text-base font-semibold sm:h-12 sm:w-auto"
        >
          Continue
        </Button>
      </div>
    </FormDialog>
  );
}
