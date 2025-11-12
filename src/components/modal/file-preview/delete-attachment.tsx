import { ModalCloseBtn } from "../modalLayout";
import Spinner from "@/components/spinner";
import { TrashIcon } from "@/components/icons";

interface DeleteMemoryAttachmentProps {
  loading?: boolean;
  open?: boolean;
  close: () => void;
  onDelete: () => void;
}

export default function DeleteMemoryAttachment({
  loading = false,
  open = false,
  close,
  onDelete,
}: DeleteMemoryAttachmentProps) {
  return (
    <div className={`modal-overlay z-[100] bg-[rgba(94,94,94,0.5)] ${open ? "flex" : "hidden"}`}>
      <div className="modal-container w-full max-w-full p-4 sm:max-w-96 sm:p-6 md:max-w-120">
        <ModalCloseBtn onClick={close} />
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#FEE4E2] text-danger">
          <TrashIcon width={16} height={18} />
        </div>
        <div className="mt-4 space-y-4 sm:mt-5 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <h4 className="modal-title text-lg sm:text-xl">Delete memory</h4>
            <span className="font-inter text-sm text-grey-600">
              Are you sure you want to delete this post? This action cannot be undone.
            </span>
          </div>
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row sm:gap-4">
            <button
              type="button"
              disabled={loading}
              className="w-full cursor-pointer rounded-lg border border-[#0011661A] bg-white/1 py-2.5 text-sm font-semibold shadow sm:flex-1"
              onClick={close}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onDelete}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-danger py-2.5 text-sm font-semibold text-white sm:flex-1"
            >
              Yes, Delete
              <Spinner loading={loading} className="!size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

