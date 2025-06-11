import endpoint from "@/api/endpoint";
import { ModalCloseBtn } from "@/components/ModalLayout";
import Spinner from "@/components/Spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useModal } from "@/hooks/use-modal";
import PauseIcon from "@/public/icon/pause-square.svg"

export function PauseCapsule({ data: id }) {
  const { trigger, isMutating } = useFetcher(`${endpoint.capsule}/${id}`, "put")
  const { close } = useModal()

  const handleDelete = async () => {
    await trigger({ status: "pause" })
    close("pause-capsule")
  }
  return (
    <div className="modal-container !max-w-120">
      <ModalCloseBtn onClick={() => close("pause-capsule")} />
      <div className="flex justify-center items-center cursor-pointer rounded-full size-12 text-primary bg-[#EFE5FF]">
        <PauseIcon width={18} height={20} />
      </div>
      <div className="space-y-6 mt-5">
        <div className="space-y-4">
          <h4 className="modal-title">Pause Delivery</h4>
          <span className="text-grey-600 text-sm font-inter">
            If you pause delivery, your time capsule will not be delivered on the scheduled day unless you resume schedule again
          </span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <button className="flex-1 cursor-pointer bg-white/1 border border-[#0011661A] rounded-lg h-10 font-inter font-semibold text-sm shadow">Cancel</button>
          <button
            disabled={isMutating}
            onClick={handleDelete}
            className="flex-1 flex items-center gap-2 justify-center cursor-pointer bg-secondary text-white rounded-lg h-10 font-inter font-semibold text-sm"
          >
            Yes, Pause
            <Spinner loading={isMutating} className="!size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}