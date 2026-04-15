"use client";

import { Checkbox } from "@/components/Form";
import { ModalCloseBtn } from "../modalLayout";
import UserItem from "@/components/user-item";
import { useModal } from "@/hooks/use-modal";
import Spinner from "@/components/spinner";
import useFetcher from "@/hooks/use-fetcher";
import { resolvePath } from "@/utility";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import { mutate } from "swr";
import type { IBeneficiary } from "@/utility/interface";
import { useState } from "react";
import useSWR from "swr";

interface AddGroupMembersProps {
  data: string;
}

export function AddGroupMembers({ data: groupId }: AddGroupMembersProps) {
  const { close } = useModal();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const url = resolvePath(endpoint.groupMembers, { id: groupId });
  const { trigger, isMutating } = useFetcher(url, "post");
  const { data: beneficiariesData } = useSWR(`${endpoint.beneficiaries}?page=1`);
  const beneficiaries: IBeneficiary[] = beneficiariesData?.data?.docs ?? [];

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      toast.error("Select at least one beneficiary.");
      return;
    }
    const result = await trigger({ beneficiaryIds: selectedIds });
    if (result?.success) {
      await mutate((key) => typeof key === "string" && key.startsWith("/groups"));
      toast.success(result?.message ?? "Members added");
      close?.("add-group-members");
    }
  };

  if (!groupId) return null;

  return (
    <div className="modal-container max-w-lg">
      <ModalCloseBtn onClick={() => close?.("add-group-members")} />
      <div className="space-y-6">
        <h4 className="modal-title">Add members</h4>
        <p className="font-inter text-sm text-gray-600">
          Select beneficiaries to add to this group.
        </p>
        <ul className="max-h-64 space-y-2 overflow-y-auto">
          {beneficiaries.length === 0 ? (
            <li className="font-inter text-sm text-gray-500">No beneficiaries to add.</li>
          ) : (
            beneficiaries.map((b) => (
              <li
                key={b._id}
                className="flex items-center justify-between rounded-lg border border-gray-100 py-2 px-3"
              >
                <UserItem {...b} avatarSize="sm" />
                <Checkbox
                  checked={selectedIds.includes(b._id ?? "")}
                  onChange={() => toggle(b._id ?? "")}
                />
              </li>
            ))
          )}
        </ul>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => close?.("add-group-members")} className="btn-outline">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isMutating || selectedIds.length === 0}
            className="btn"
          >
            Add selected
            <Spinner className="!size-4" loading={isMutating} />
          </button>
        </div>
      </div>
    </div>
  );
}
