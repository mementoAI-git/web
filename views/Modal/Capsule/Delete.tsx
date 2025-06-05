import endpoint from "@/api/endpoint";
import { ModalCloseBtn } from "@/components/ModalLayout";
import Spinner from "@/components/Spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useModal } from "@/hooks/use-modal";
import BinIcon from "@/public/icon/bin.svg"

export function DeleteCapsule({ data: id }) {
  const { trigger, isMutating } = useFetcher(endpoint.capsule, "delete")
  const { close } = useModal()

  const handleDelete = async () => {
    await trigger(id)
    close("delete-capsule")
  }
  return (
    <div className="modal-container !max-w-120">
      <ModalCloseBtn onClick={() => close("delete-capsule")} />
      <div className="flex justify-center items-center cursor-pointer rounded-full size-12 text-danger bg-[#FEE4E2]">
        <BinIcon width={18} height={20} />
      </div>
      <div className="space-y-6 mt-5">
        <div className="space-y-4">
          <h4 className="modal-title">Delete capsule</h4>
          <span className="text-grey-600 text-sm font-inter">
            Are you sure you want to delete this post? This action cannot be undone.
          </span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <button className="flex-1 cursor-pointer bg-white/1 border border-[#0011661A] rounded-lg h-10 font-inter font-semibold text-sm shadow">Cancel</button>
          <button
            disabled={isMutating}
            onClick={handleDelete}
            className="flex-1 flex items-center gap-2 justify-center cursor-pointer bg-danger text-white rounded-lg h-10 font-inter font-semibold text-sm"
          >
            Yes, Delete
            <Spinner loading={isMutating} className="!size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}