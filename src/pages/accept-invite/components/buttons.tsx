import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import endpoint from "@/api/endpoint";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="border border-v3-stroke-weak bg-v3-fill-weaker/30 py-0 shadow-none">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col-reverse items-stretch justify-center gap-3 sm:flex-row sm:justify-center">
          <Button type="button" variant="outline" disabled className="h-11 rounded-full sm:min-w-[120px]">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAcceptInvitation}
            className="h-11 rounded-full sm:min-w-[160px]"
            disabled={isMutating}
          >
            {isMutating ?
              <>
                <Loader2 className="size-4 animate-spin" />
                Accepting...
              </>
            : "Accept invite"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default AcceptInviteButtons;
