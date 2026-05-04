import { ModalCloseBtn } from "../modalLayout";
import { Button } from "@/components/ui/button";

interface CloseWithFilesConfirmationProps {
  open?: boolean;
  close: () => void;
  onConfirm: () => void;
}

export function CloseWithFilesConfirmation({
  open = false,
  close,
  onConfirm,
}: CloseWithFilesConfirmationProps) {
  return (
    <div
      className={`modal-overlay z-[100] bg-overlay-backdrop ${open ? "flex" : "hidden"}`}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="discard-story-title"
      aria-describedby="discard-story-desc"
    >
      <div className="modal-container w-full max-w-full sm:!max-w-96 md:!max-w-120 p-4 sm:p-6">
        <ModalCloseBtn onClick={close} />
        <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-5">
          <div className="space-y-3 sm:space-y-4">
            <h4 id="discard-story-title" className="modal-title text-lg sm:text-xl font-semibold text-text-neutral-strong">
              Discard this story?
            </h4>
            <p id="discard-story-desc" className="text-sm font-inter text-text-neutral-weak leading-relaxed">
              You have unsaved text, attachments, tags, or access settings. If you close now, those changes will be
              lost.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:flex-1 h-10 rounded-lg border-stroke-neutral-weak bg-bg-neutral font-inter font-semibold text-sm text-text-neutral-strong"
              onClick={close}
            >
              Keep editing
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:flex-1 h-10 rounded-lg font-inter font-semibold text-sm"
              onClick={onConfirm}
            >
              Discard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
