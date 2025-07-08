import endpoint from "@/api/endpoint"
import Spinner from "@/components/Spinner"
import useFetcher from "@/hooks/use-fetcher"
import { toast } from "sonner"
import { useRouter } from "next/navigation";
import { IBeneficiary } from "@/utility/interface";

export default function AcceptInviteButtons({ data }: { data: IBeneficiary }) {
  const { trigger, isMutating } = useFetcher(endpoint.acceptInvite)
  const router = useRouter();

  const handleAcceptInvitation = async () => {
    if (isMutating) return;
    const result = await trigger({ invite_id: data?._id })
    if (result.success) {
      toast.success(result?.message)
      router.push("/login")
    }
  }
  return (
    <div className="flex gap-3 justify-center items-center">
      <button disabled className="btn-outline">Cancel</button>
      <button onClick={handleAcceptInvitation} className="btn">
        Accept invite
        {isMutating && <Spinner loading className="mr-2 !size-4" />}
      </button>
    </div>
  )
}