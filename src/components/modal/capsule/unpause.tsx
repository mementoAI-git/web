import endpoint from "@/api/endpoint";
import { ModalCloseBtn } from "../modalLayout";
import Spinner from "@/components/spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useModal } from "@/hooks/use-modal";
import { PlaySolidIcon } from "@/components/icons";
import { toast } from "sonner";
import { mutate } from "swr";

interface UnpauseCapsuleProps {
  data: string;
}

export function UnpauseCapsule({ data: id }: UnpauseCapsuleProps) {
  const { close } = useModal();
  const { trigger, isMutating } = useFetcher(
    `${endpoint.capsule}/${id}`,
    "put",
  );

  const handleUnpause = async () => {
    const result = await trigger({ status: "scheduled" });
    if (result?.success) {
      await mutate(
        (key) => typeof key === "string" && key.startsWith(endpoint.capsule),
      );
      await mutate(endpoint.capsuleStats);
      toast.success(result.message);
    }
    close?.("unpause-capsule");
  };

  return (
    <div className="modal-container max-w-120!">
      <ModalCloseBtn onClick={() => close?.("unpause-capsule")} />
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#EFE5FF] text-primary">
        <PlaySolidIcon width={18} height={20} />
      </div>
      <div className="mt-5 space-y-6">
        <div className="space-y-4">
          <h4 className="modal-title">Resume Delivery</h4>
          <span className="font-inter text-sm text-grey-600">
            Resuming delivery will reschedule your time capsule to be delivered
            on the original scheduled date.
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            className="flex-1 cursor-pointer rounded-lg border border-stroke-neutral-weak bg-white/1 py-2.5 text-sm font-semibold shadow"
            onClick={() => close?.("unpause-capsule")}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isMutating}
            onClick={handleUnpause}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            Yes, Resume
            <Spinner loading={isMutating} className="!size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
