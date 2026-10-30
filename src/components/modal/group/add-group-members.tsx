"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { ModalCloseBtn } from "../modalLayout";
import UserItem from "@/components/user-item";
import { useModal } from "@/hooks/use-modal";
import Spinner from "@/components/spinner";
import { useGuardedModalFetcher } from "@/components/modal/use-guarded-modal-fetcher";
import { resolvePath } from "@/utility";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import { mutate } from "swr";
import type { IBeneficiary } from "@/utility/interface";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/api/fetcher";
import { useRequestRecovery } from "@/hooks/use-request-recovery";

interface AddGroupMembersProps {
  data: string;
}

export function AddGroupMembers({ data: groupId }: AddGroupMembersProps) {
  const { close } = useModal();
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const url = resolvePath(endpoint.groupMembers, { id: groupId });
  const { trigger, isMutating } = useGuardedModalFetcher(
    "add-group-members",
    url,
    "post",
  );
  const {
    data: beneficiariesData,
    error,
    isLoading,
    mutate: refresh,
  } = useSWR(`${endpoint.beneficiaries}?page=${page}`, fetcher, {
    shouldRetryOnError: false,
  });
  const retry = useRequestRecovery(
    `group-members:${groupId}:${page}`,
    error,
    refresh,
    "Couldn’t load beneficiaries. Please try again.",
  );
  const beneficiaries: IBeneficiary[] = beneficiariesData?.data?.docs ?? [];

  const toggle = (id: string) => {
    if (isMutating || error) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async () => {
    if (isLoading || error || isMutating) return;
    if (selectedIds.length === 0) {
      toast.error("Select at least one beneficiary.");
      return;
    }
    const result = await trigger({ beneficiaryIds: selectedIds });
    if (result?.success) {
      void mutate(
        (key) => typeof key === "string" && key.startsWith("/groups"),
      ).catch(() => undefined);
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
        <p className="font-inter text-sm text-v3-text-weak">
          Select beneficiaries to add to this group.
        </p>
        <ul className="max-h-64 space-y-2 overflow-y-auto">
          {isLoading ? (
            <li role="status">Loading beneficiaries…</li>
          ) : error ? (
            <li>
              <button type="button" className="btn-outline" onClick={retry}>
                Retry loading beneficiaries
              </button>
            </li>
          ) : beneficiaries.length === 0 ? (
            <li className="font-inter text-sm text-v3-text-weaker">
              {page > 1
                ? "No beneficiaries on this page."
                : "No beneficiaries to add."}
            </li>
          ) : (
            beneficiaries.map((b) => (
              <li
                key={b._id}
                className="flex items-center justify-between rounded-lg border border-v3-stroke-weak py-2 px-3"
              >
                <UserItem {...b} avatarSize="sm" />
                <Checkbox
                  disabled={isMutating}
                  aria-label={`Select ${b.name || b.email}`}
                  checked={selectedIds.includes(b._id ?? "")}
                  onCheckedChange={() => toggle(b._id ?? "")}
                />
              </li>
            ))
          )}
        </ul>
        <div className="flex justify-between gap-2">
          <button
            type="button"
            className="btn-outline"
            disabled={page === 1 || isMutating || isLoading}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous page
          </button>
          <button
            type="button"
            className="btn-outline"
            disabled={
              isMutating ||
              isLoading ||
              Boolean(error) ||
              !beneficiariesData?.data?.hasNextPage
            }
            onClick={() => setPage((current) => current + 1)}
          >
            Next page
          </button>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={isMutating}
            onClick={() => close?.("add-group-members")}
            className="btn-outline"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              isMutating ||
              isLoading ||
              Boolean(error) ||
              selectedIds.length === 0
            }
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
