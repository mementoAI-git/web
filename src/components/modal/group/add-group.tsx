"use client";

import { useModal } from "@/hooks/use-modal";
import { useGuardedModalFetcher } from "@/components/modal/use-guarded-modal-fetcher";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import { mutate } from "swr";
import { GroupFormDialog } from "./group-form-dialog";

export function AddGroup() {
  const { close } = useModal();
  const { trigger, isMutating } = useGuardedModalFetcher(
    "add-group",
    endpoint.groups,
    "post",
  );

  return (
    <GroupFormDialog
      title="New group"
      description="Create a group to organize your people."
      submitLabel="Create group"
      busyLabel="Creating…"
      initial={{ name: "", description: "", color: 0 }}
      busy={isMutating}
      onClose={() => close?.("add-group")}
      onSubmit={async (payload) => {
        const result = await trigger(payload);
        if (result?.success) {
          void mutate(
            (key) => typeof key === "string" && key.startsWith("/groups"),
          ).catch(() => undefined);
          toast.success(result?.message ?? "Group created");
          close?.("add-group");
        }
      }}
    />
  );
}
