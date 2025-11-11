import { useState } from "react";
import endpoint from "@/api/endpoint";
import { ModalCloseBtn } from "../modalLayout";
import Spinner from "@/components/spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useModal } from "@/hooks/use-modal";
import { resolvePath } from "@/utility";
import { mutate } from "swr";
import { useNavigate, useLocation } from "react-router-dom";

interface DeleteMemoryProps {
  data: { memory: { _id: string; status?: string } };
}

export function DeleteMemory({ data: { memory } }: DeleteMemoryProps) {
  const { close } = useModal();
  const navigate = useNavigate();
  const location = useLocation();
  const { trigger, isMutating } = useFetcher(
    resolvePath(endpoint.memory, { id: memory._id }),
    "delete",
  );
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    if (submitting) return;
    setSubmitting(true);
    const result = await trigger({ delete_permanently: memory?.status === "deleted" });
    if (result?.success) {
      if (location.pathname.includes(memory._id)) {
        navigate("/memories");
      }
      mutate((key) => typeof key === "string" && key.startsWith(`${endpoint.stories}`));
      close("delete-memory");
    }
    setSubmitting(false);
  };

  return (
    <div className="modal-container !max-w-120">
      <ModalCloseBtn onClick={() => close("delete-memory")} />
      <div className="mt-5 space-y-6">
        <div className="space-y-4">
          <h4 className="modal-title">Delete memory</h4>
          <span className="font-inter text-sm text-grey-600">
            Are you sure you want to delete this post? This action cannot be undone.
          </span>
        </div>
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            className="h-10 cursor-pointer rounded-full border border-[#0011661A] bg-white/1 px-4 py-2.5 font-inter text-sm font-semibold shadow"
            onClick={() => close("delete-memory")}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isMutating || submitting}
            onClick={handleDelete}
            className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-danger px-4 py-2.5 font-inter text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            Yes, Delete
            <Spinner loading={isMutating || submitting} className="!size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}