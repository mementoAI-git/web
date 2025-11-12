import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import endpoint from "@/api/endpoint";
import Spinner from "@/components/spinner";
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
    <div className="flex flex-col-reverse items-center justify-center gap-3 sm:flex-row">
      <button disabled className="btn-outline w-full sm:w-auto">
        Cancel
      </button>
      <button onClick={handleAcceptInvitation} className="btn w-full sm:w-auto">
        Accept invite
        <Spinner loading={isMutating} className="ml-2 mr-0! size-4!" />
      </button>
    </div>
  );
}

export default AcceptInviteButtons;

