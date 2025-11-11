import { ModalCloseBtn } from "../modalLayout";

interface CloseWithFilesConfirmationProps {
  open?: boolean;
  close: () => void;
  onConfirm: () => void;
}

export function CloseWithFilesConfirmation({ open = false, close, onConfirm }: CloseWithFilesConfirmationProps) {
  return (
    <div className={`modal-overlay z-[100] bg-[rgba(94,94,94,0.5)] ${open ? "flex" : "hidden"}`}>
      <div className="modal-container w-full max-w-full sm:!max-w-96 md:!max-w-120 p-4 sm:p-6">
        <ModalCloseBtn onClick={close} />
        <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-5">
          <div className="space-y-3 sm:space-y-4">
            <h4 className="modal-title text-lg sm:text-xl">Close with files</h4>
            <span className="text-grey-600 text-sm font-inter">
              You have files attached to this memory. Are you sure you want to close without saving? Any unsaved changes will be lost.
            </span>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <button
              className="w-full sm:flex-1 cursor-pointer bg-white/1 border border-[#0011661A] rounded-lg h-10 font-inter font-semibold text-sm shadow"
              onClick={close}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="w-full sm:flex-1 cursor-pointer bg-orange-500 text-white rounded-lg h-10 font-inter font-semibold text-sm"
            >
              Yes, Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
