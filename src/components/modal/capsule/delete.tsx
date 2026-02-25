import endpoint from "@/api/endpoint";
import { ModalCloseBtn } from "../modalLayout";
import Spinner from "@/components/spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useModal } from "@/hooks/use-modal";
import { TrashIcon } from "@/components/icons";
import { resolvePath } from "@/utility";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { IMemory } from "@/utility/interface";

interface DeleteCapsuleProps {
  data: string;
}

export function DeleteCapsule({ data: id }: DeleteCapsuleProps) {
  const { close } = useModal();
  const navigate = useNavigate();
  const { trigger, isMutating } = useFetcher(resolvePath(endpoint.capsuleDelete, { id }), "delete");

  const handleDelete = async () => {
    const result = await trigger({});
    if (result?.success) {
      toast.success(result.message);
    }
    close?.("delete-capsule");
    navigate("/time-capsule");
  };

  return (
    <div className="modal-container !max-w-120">
      <ModalCloseBtn onClick={() => close?.("delete-capsule")} />
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#FEE4E2] text-danger">
        <TrashIcon width={18} height={20} />
      </div>
      <div className="mt-5 space-y-6">
        <div className="space-y-4">
          <h4 className="modal-title">Delete capsule</h4>
          <span className="font-inter text-sm text-grey-600">
            Are you sure you want to delete this post? This action cannot be undone.
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            className="flex-1 cursor-pointer rounded-lg border border-[#0011661A] bg-white/1 py-2.5 text-sm font-semibold shadow"
            onClick={() => close?.("delete-capsule")}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isMutating}
            onClick={handleDelete}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-danger py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            Yes, Delete
            <Spinner loading={isMutating} className="!size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

