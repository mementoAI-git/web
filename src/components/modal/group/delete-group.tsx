"use client";

import { useGuardedModalFetcher } from "@/components/modal/use-guarded-modal-fetcher";
import { useModal } from "@/hooks/use-modal";
import { resolvePath } from "@/utility";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import { mutate } from "swr";
import { DeletePromptModal } from "../delete-prompt-modal";

interface DeleteGroupProps {
  data: string;
}

export function DeleteGroup({ data: id }: DeleteGroupProps) {
  const { trigger, isMutating } = useGuardedModalFetcher(
    "delete-group",
    id ? resolvePath(endpoint.group, { id }) : "",
    "delete",
  );
  const { close } = useModal();

  const handleDelete = async () => {
    const result = await trigger({});
    if (result?.success) {
      void mutate(
        (key) => typeof key === "string" && key.startsWith("/groups"),
      ).catch(() => undefined);
      toast.success(result?.message ?? "Group deleted");
      close?.("delete-group");
    }
  };

  if (!id) return null;

  return (
    <DeletePromptModal
      onClose={() => close?.("delete-group")}
      title="Delete group"
      description={
        <>
          <p>This action cannot be undone.</p>
          <p className="mt-3">
            Are you sure you want to delete this group? Beneficiaries will not
            be removed from your account.
          </p>
        </>
      }
      confirmLabel="Delete group"
      onConfirm={handleDelete}
      loading={isMutating}
    />
  );
}
