"use client";

import { X, Trash2 } from "lucide-react";
import { Button } from "@heroui/react";
import Spinner from "@/components/spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useModal } from "@/hooks/use-modal";
import { resolvePath } from "@/utility";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import { mutate } from "swr";

interface DeleteGroupProps {
  data: string;
}

export function DeleteGroup({ data: id }: DeleteGroupProps) {
  const { trigger, isMutating } = useFetcher(id ? resolvePath(endpoint.group, { id }) : "", "delete");
  const { close } = useModal();

  const handleDelete = async () => {
    const result = await trigger({});
    if (result?.success) {
      await mutate((key) => typeof key === "string" && key.startsWith("/groups"));
      toast.success(result?.message ?? "Group deleted");
      close?.("delete-group");
    }
  };

  if (!id) return null;

  return (
    <div className="modal-container !p-5 !max-w-[420px]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
            <Trash2 size={16} strokeWidth={1.5} />
          </div>
          <div className="flex flex-col gap-0.5">
            <h2 className="font-inter text-sm font-semibold text-v3-text-strong">Delete group</h2>
            <p className="font-inter text-sm text-v3-text-weak">This action cannot be undone.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => close?.("delete-group")}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-v3-text-weak transition-colors hover:bg-v3-fill-weak hover:text-v3-text-strong focus-visible:outline-none"
          aria-label="Close"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      <p className="mb-6 font-inter text-sm text-v3-text-weak">
        Are you sure you want to delete this group? Beneficiaries will not be removed from your account.
      </p>

      <div className="flex items-center justify-end gap-2 border-t border-v3-stroke-weak pt-4">
        <Button
          type="button"
          variant="bordered"
          size="sm"
          className="h-9 rounded-full border-v3-stroke-weak font-inter text-sm font-medium text-v3-text-strong hover:bg-v3-fill-weak"
          onPress={() => close?.("delete-group")}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          isDisabled={isMutating}
          onPress={handleDelete}
          className="h-9 rounded-full bg-danger px-4 font-inter text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {isMutating ? (
            <span className="flex items-center gap-2">
              Deleting… <Spinner className="!size-4" loading />
            </span>
          ) : (
            "Delete group"
          )}
        </Button>
      </div>
    </div>
  );
}
