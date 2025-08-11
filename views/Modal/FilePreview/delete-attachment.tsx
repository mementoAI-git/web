import { ModalCloseBtn } from "@/components/ModalLayout";
import Spinner from "@/components/Spinner";
import BinIcon from "@/public/icon/bin.svg"

export function DeleteMemoryAttachment({ loading = false, open = false, close, onDelete }) {
  return (
    <div className={`modal-overlay z-[100] bg-[rgba(94,94,94,0.5)] ${open ? "flex" : "hidden"}`}>
      <div className="modal-container w-full max-w-full sm:max-w-96 md:max-w-120 p-4 sm:p-6">
        <ModalCloseBtn onClick={close} />
        <div className="flex justify-center items-center cursor-pointer rounded-full size-10 sm:size-12 text-danger bg-[#FEE4E2]">
          <BinIcon width={16} height={18} className="sm:w-[18px] sm:h-[20px]" />
        </div>
        <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-5">
          <div className="space-y-3 sm:space-y-4">
            <h4 className="modal-title text-lg sm:text-xl">Delete memory</h4>
            <span className="text-grey-600 text-sm font-inter">
              Are you sure you want to delete this post? This action cannot be undone.
            </span>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <button
              disabled={loading}
              className="w-full sm:flex-1 cursor-pointer bg-white/1 border border-[#0011661A] rounded-lg h-10 font-inter font-semibold text-sm shadow"
              onClick={close}
            >
              Cancel
            </button>
            <button
              disabled={loading}
              onClick={onDelete}
              className="w-full sm:flex-1 flex items-center gap-2 justify-center cursor-pointer bg-danger text-white rounded-lg h-10 font-inter font-semibold text-sm"
            >
              Yes, Delete
              <Spinner loading={loading} className="!size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}