import endpoint from "@/api/endpoint";
import { ModalCloseBtn } from "@/components/ModalLayout";
import Spinner from "@/components/Spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useModal } from "@/hooks/use-modal";
import PlanePaperIcon from "@/public/icon/plane-paper.svg"
import { cn } from "@/utility";
import { toast } from "sonner";
import { mutate } from "swr";

export function ResendInvite({ data }) {
  const { trigger, isMutating } = useFetcher(endpoint.resendInvite, "post")
  const { close } = useModal()

  const handleResendInvite = async () => {
    const result = await trigger({ email: data?.email })
    if (result?.data) {
      await mutate(`${endpoint.beneficiaries}?page=1`)
      toast.success(result?.message || "Invite resent successfully")
      close("resend-invite")
    }
  }

  return (
    <div className="modal-container !max-w-120">
      <ModalCloseBtn onClick={() => close("resend-invite")} />
      <div className="space-y-6 mt-5">
        <div className="space-y-4">
          <h4 className="modal-title">Resend Invite</h4>
          <span className="text-grey-600 text-sm font-inter">
            Are you sure you want to resend the invitation to this beneficiary? They will receive a new email notification.
          </span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <button
            onClick={() => close("resend-invite")}
            className={cn("btn flex-1 !bg-white border border-[#0011661A] !rounded-lg h-10 !text-secondary shadow")}
          >
            Cancel
          </button>
          <button
            disabled={isMutating}
            onClick={handleResendInvite}
            className={cn("btn flex-1 !rounded-lg")}
          >
            Yes, Resend
            <Spinner loading={isMutating} className="!size-4" />
          </button>
        </div>
      </div>
    </div>
  )
} 