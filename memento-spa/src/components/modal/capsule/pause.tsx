import endpoint from "@/api/endpoint";
import { ModalCloseBtn } from "../modalLayout";
import Spinner from "@/components/spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useModal } from "@/hooks/use-modal";
import { PauseSquareIcon } from "@/components/icons";

interface PauseCapsuleProps {
  data: string;
}

export function PauseCapsule({ data: id }: PauseCapsuleProps) {
  const { close } = useModal();
  const { trigger, isMutating } = useFetcher(`${endpoint.capsule}/${id}`, "put");

  const handlePause = async () => {
    await trigger({ status: "pause" });
    close?.("pause-capsule");
  };

  return (
    <div className="modal-container !max-w-120">
      <ModalCloseBtn onClick={() => close?.("pause-capsule")} />
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#EFE5FF] text-primary">
        <PauseSquareIcon width={18} height={20} />
      </div>
      <div className="mt-5 space-y-6">
        <div className="space-y-4">
          <h4 className="modal-title">Pause Delivery</h4>
          <span className="font-inter text-sm text-grey-600">
            If you pause delivery, your time capsule will not be delivered on the scheduled day unless you resume schedule
            again.
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            className="flex-1 cursor-pointer rounded-lg border border-[#0011661A] bg-white/1 py-2.5 text-sm font-semibold shadow"
            onClick={() => close?.("pause-capsule")}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isMutating}
            onClick={handlePause}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-secondary py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            Yes, Pause
            <Spinner loading={isMutating} className="!size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

