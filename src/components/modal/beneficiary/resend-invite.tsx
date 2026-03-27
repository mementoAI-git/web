import endpoint from "@/api/endpoint";
import { ModalCloseBtn } from "../modalLayout";
import Spinner from "@/components/spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useModal } from "@/hooks/use-modal";
import { PlanePaperIcon } from "@/components/icons";
import { cn } from "@/utility";
import { toast } from "sonner";
import { mutate } from "swr";
import { SETTINGS_BENEFICIARIES_SWR_KEY } from "@/components/modal/settings/beneficiary&group/beneficiaries-list-swr-key";

interface ResendInviteProps {
  data: { email: string };
}

export function ResendInvite({ data }: ResendInviteProps) {
  const { trigger, isMutating } = useFetcher(endpoint.resendInvite, "post");
  const { close } = useModal();

  const handleResendInvite = async () => {
    const result = await trigger({ email: data?.email });
    if (result?.data) {
      await mutate(SETTINGS_BENEFICIARIES_SWR_KEY);
      toast.success(result?.message || "Invite resent successfully");
      close?.("resend-invite");
    }
  };

  return (
    <div className="modal-container !max-w-120">
      <ModalCloseBtn onClick={() => close?.("resend-invite")} />
      <div className="mt-5 space-y-6">
        <div className="space-y-4">
          <h4 className="modal-title">Resend Invite</h4>
          <span className="font-inter text-sm text-grey-600">
            Are you sure you want to resend the invitation to this beneficiary? They will receive a new email notification.
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => close?.("resend-invite")}
            className={cn("btn flex-1 !rounded-lg !bg-white border border-[#0011661A] !text-secondary shadow")}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isMutating}
            onClick={handleResendInvite}
            className={cn("btn flex-1 !rounded-lg")}
          >
            <PlanePaperIcon width={16} height={16} />
            Yes, Resend
            <Spinner loading={isMutating} className="!size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

