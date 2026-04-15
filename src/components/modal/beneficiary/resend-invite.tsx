import endpoint from "@/api/endpoint";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useModal } from "@/hooks/use-modal";
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
    <div className="modal-container !max-w-[420px]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-v3-fill-weak text-v3-text-strong">
            <Send size={15} strokeWidth={1.5} />
          </div>
          <div className="flex flex-col gap-0.5">
            <h2 className="font-inter text-sm font-semibold text-v3-text-strong">Resend invite</h2>
            <p className="font-inter text-sm text-v3-text-weak">{data?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => close?.("resend-invite")}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-v3-text-weak hover:bg-v3-fill-weak hover:text-v3-text-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2"
          aria-label="Close"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      <p className="mb-6 font-inter text-sm text-v3-text-weak">
        Send a new invitation email to this beneficiary. Their previous invite link will be replaced.
      </p>

      <div className="flex items-center justify-end gap-2 border-t border-v3-stroke-weak pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-full border-v3-stroke-weak font-inter text-sm font-medium text-v3-text-strong hover:bg-v3-fill-weak"
          onClick={() => close?.("resend-invite")}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isMutating}
          onClick={handleResendInvite}
          className="h-9 rounded-full bg-v3-fill-strong px-4 font-inter text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {isMutating ? (
            <span className="flex items-center gap-2">
              Sending… <Spinner className="!size-4" loading />
            </span>
          ) : (
            "Resend invite"
          )}
        </Button>
      </div>
    </div>
  );
}
