import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import endpoint from "@/api/endpoint";
import { OnboardingButton } from "@/pages/onboarding/components/onboarding-card";
import useFetcher from "@/hooks/use-fetcher";
import type { IBeneficiary } from "@/utility/interface";

interface AcceptInviteButtonsProps {
  data: IBeneficiary;
}

function AcceptInviteButtons({ data }: AcceptInviteButtonsProps) {
  const navigate = useNavigate();
  const { trigger, isMutating } = useFetcher(endpoint.acceptInvite);

  const handleAcceptInvitation = async () => {
    if (isMutating) return;
    const result = await trigger({ invite_id: data?._id });
    if (result.success) {
      toast.success(result?.message);
      navigate("/login");
    }
  };

  return (
    <div className="flex flex-col-reverse items-stretch justify-center gap-3 sm:flex-row sm:justify-center">
      <OnboardingButton
        type="button"
        variant="outline"
        disabled
        className="sm:min-w-[120px]"
      >
        Cancel
      </OnboardingButton>
      <OnboardingButton
        type="button"
        onClick={handleAcceptInvitation}
        className="sm:min-w-[160px]"
        disabled={isMutating}
      >
        {isMutating ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Accepting...
          </>
        ) : (
          "Accept invite"
        )}
      </OnboardingButton>
    </div>
  );
}

export default AcceptInviteButtons;
