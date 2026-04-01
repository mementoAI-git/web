import type { ReactNode } from "react";
import { ModalCloseBtn } from "./modalLayout";
import Spinner from "@/components/spinner";

export type DeletePromptModalProps = {
  onClose: () => void;
  title: string;
  description: ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  onConfirm: () => void;
  loading?: boolean;
  confirmDisabled?: boolean;
};

const cancelClass =
  "h-10 cursor-pointer rounded-full border border-stroke-neutral-weak bg-white/1 px-4 py-2.5 font-inter text-sm font-semibold shadow";

const confirmClass =
  "flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-danger px-4 py-2.5 font-inter text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70";

export function DeletePromptModal({
  onClose,
  title,
  description,
  cancelLabel = "Cancel",
  confirmLabel,
  onConfirm,
  loading = false,
  confirmDisabled = false,
}: DeletePromptModalProps) {
  return (
    <div className="modal-container !max-w-120 !p-5">
      <ModalCloseBtn onClick={onClose} />
      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="modal-title">{title}</h4>
          <div className="font-inter text-sm text-text-neutral-weak">{description}</div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button type="button" className={cancelClass} onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading || confirmDisabled}
            onClick={onConfirm}
            className={confirmClass}
          >
            {confirmLabel}
            <Spinner loading={loading} className="!size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
