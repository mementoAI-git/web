"use client";

import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal";
import { useGuardedModalFetcher } from "@/components/modal/use-guarded-modal-fetcher";
import { toast } from "sonner";
import { mutate } from "swr";
import { resolvePath } from "@/utility";
import endpoint from "@/api/endpoint";
import type { IGroup } from "@/utility/interface";
import { GroupFormDialog } from "./group-form-dialog";

interface UpdateGroupProps {
  data: IGroup;
}

export function UpdateGroup({ data: group }: UpdateGroupProps) {
  const { close, open } = useModal();
  const url = group?._id ? resolvePath(endpoint.group, { id: group._id }) : "";
  const { trigger, isMutating } = useGuardedModalFetcher(
    "update-group",
    url,
    "put",
  );

  if (!group?._id) return null;

  return (
    <GroupFormDialog
      title="Group settings"
      description="Update this group's name, description, or color."
      submitLabel="Save changes"
      busyLabel="Saving…"
      initial={{
        name: group.name ?? "",
        description: group.description ?? "",
        color: group.color ?? 0,
      }}
      busy={isMutating}
      onClose={() => close?.("update-group")}
      onSubmit={async (payload) => {
        const result = await trigger(payload);
        if (result?.success) {
          void mutate(
            (key) => typeof key === "string" && key.startsWith("/groups"),
          ).catch(() => undefined);
          toast.success(result?.message ?? "Group updated");
          close?.("update-group");
        }
      }}
      leading={
        <Button
          type="button"
          variant="ghost"
          className="h-12 rounded-full px-3 text-text-error-strong hover:text-text-error-strong"
          disabled={isMutating}
          onClick={() => {
            close?.("update-group");
            open?.("delete-group", group._id);
          }}
        >
          Delete group
        </Button>
      }
    />
  );
}
