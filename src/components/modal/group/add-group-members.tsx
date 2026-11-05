"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FormDialog, FormDialogFooter } from "@/components/modal/form-dialog";
import { UserAvatar } from "@/components/user-avatar";
import { useModal } from "@/hooks/use-modal";
import { useGuardedModalFetcher } from "@/components/modal/use-guarded-modal-fetcher";
import { resolvePath } from "@/utility";
import endpoint from "@/api/endpoint";
import { toast } from "sonner";
import { mutate } from "swr";
import type { IBeneficiary, IGroup } from "@/utility/interface";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/api/fetcher";
import { groupDetailKey } from "@/api/groups";
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
  } = useSWR<{ data?: { docs?: IBeneficiary[]; hasNextPage?: boolean } }>(
    `${endpoint.beneficiaries}?page=${page}`,
    fetcher,
    { shouldRetryOnError: false },
  );
  const { data: groupData } = useSWR<{ data?: IGroup }>(
    groupDetailKey(groupId),
    fetcher,
    { shouldRetryOnError: false },
  );
  const retry = useRequestRecovery(
    `group-members:${groupId}:${page}`,
    error,
    refresh,
    "Couldn’t load people. Please try again.",
  );
  const memberIds = new Set(
    (groupData?.data?.members ?? []).map((member) =>
      typeof member === "string" ? member : (member._id ?? ""),
    ),
  );
  const people: IBeneficiary[] = (beneficiariesData?.data?.docs ?? []).filter(
    (person: IBeneficiary) => !memberIds.has(person._id ?? ""),
  );
  const hasNextPage = Boolean(beneficiariesData?.data?.hasNextPage);
  const dismiss = () => close?.("add-group-members");

  const toggle = (id: string) => {
    if (isMutating || error) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSubmit = async () => {
    if (isLoading || error || isMutating) return;
    if (selectedIds.length === 0) {
      toast.error("Select at least one person.");
      return;
    }
    const result = await trigger({ beneficiaryIds: selectedIds });
    if (result?.success) {
      void mutate(
        (key) => typeof key === "string" && key.startsWith("/groups"),
      ).catch(() => undefined);
      toast.success(result?.message ?? "Members added");
      dismiss();
    }
  };

  if (!groupId) return null;

  return (
    <FormDialog
      title="Add people"
      description="Select people from your connections to add to this group."
      onClose={dismiss}
      busy={isMutating}
    >
      <div className="flex flex-col gap-5">
        <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
          {isLoading ? (
            <li role="status" className="py-6 text-center text-sm text-text-neutral-weak">
              Loading people…
            </li>
          ) : error ? (
            <li className="py-4 text-center">
              <Button variant="outline" onClick={retry}>
                Retry loading beneficiaries
              </Button>
            </li>
          ) : people.length === 0 ? (
            <li className="py-6 text-center text-sm text-text-neutral-weak">
              {page > 1 ? "No people on this page." : "No people to add."}
            </li>
          ) : (
            people.map((person) => {
              const id = person._id ?? "";
              return (
                <li key={id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-fill-neutral-weak">
                    <UserAvatar
                      alt={person.name || person.email}
                      src={person.user?.picture_url}
                      name={person.name}
                      email={person.email}
                      userId={person.user?._id}
                      size="md"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-text-neutral-strong">
                        {person.name || person.email}
                      </span>
                      <span className="block truncate text-xs capitalize text-text-neutral-weak">
                        {person.relationship || person.email}
                      </span>
                    </span>
                    <Checkbox
                      disabled={isMutating}
                      aria-label={`Select ${person.name || person.email}`}
                      checked={selectedIds.includes(id)}
                      onCheckedChange={() => toggle(id)}
                    />
                  </label>
                </li>
              );
            })
          )}
        </ul>
        {page > 1 || hasNextPage ? (
          <div className="flex justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={page === 1 || isMutating || isLoading}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous page
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isMutating || isLoading || Boolean(error) || !hasNextPage}
              onClick={() => setPage((current) => current + 1)}
            >
              Next page
            </Button>
          </div>
        ) : null}
        <FormDialogFooter
          submitLabel="Add to group"
          busyLabel="Adding…"
          busy={isMutating}
          disabled={isLoading || Boolean(error) || selectedIds.length === 0}
          onDismiss={dismiss}
          onSubmit={() => void handleSubmit()}
        />
      </div>
    </FormDialog>
  );
}
