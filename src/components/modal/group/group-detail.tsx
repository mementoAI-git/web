"use client";

import { X, Trash2, UserPlus } from "lucide-react";
import { Button } from "@heroui/react";
import { useModal } from "@/hooks/use-modal";
import Spinner from "@/components/spinner";
import { toast } from "sonner";
import { mutate } from "swr";
import useSWR from "swr";
import { fetcher } from "@/api/fetcher";
import type { IResponse } from "@/api/interface";
import type { IGroup, IGroupMember } from "@/utility/interface";
import { groupDetailKey, removeGroupMember } from "@/api/groups";
import { GROUP_COLORS } from "@/utility/constant";
import { cn } from "@/utility";

interface GroupDetailProps {
  data: string;
}

function isPopulatedMember(m: string | IGroupMember): m is IGroupMember {
  return typeof m === "object" && m !== null && "name" in m;
}

function getMemberId(member: string | IGroupMember): string {
  if (typeof member === "string") return member;
  return (member as IGroupMember)._id ?? "";
}

export function GroupDetail({ data: groupId }: GroupDetailProps) {
  const { close, open } = useModal();
  const key = groupDetailKey(groupId);
  const { data: response, isLoading, mutate: revalidate } = useSWR<IResponse>(key, key ? fetcher : null);
  const group = response?.data as IGroup | undefined;

  const handleRemoveMember = async (beneficiaryId: string) => {
    try {
      const result = await removeGroupMember(groupId, beneficiaryId);
      if (result?.message) {
        toast.success(result.message);
        revalidate();
        mutate((k) => typeof k === "string" && k.startsWith("/groups"));
      }
    } catch {
      // toast handled by API
    }
  };

  if (!groupId) return null;

  const colorClass = group?.color != null
    ? GROUP_COLORS[Math.min(group.color, GROUP_COLORS.length - 1)]
    : GROUP_COLORS[0];

  return (
    <div className="modal-container !p-5 !max-w-[480px]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-inter text-sm font-semibold text-v3-text-strong">Group members</h2>
          {group?.name && (
            <span className={cn("mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 font-inter text-xs font-medium w-fit", colorClass)}>
              {group.name}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => close?.("group-detail")}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-v3-text-weak transition-colors hover:bg-v3-fill-weak hover:text-v3-text-strong focus-visible:outline-none"
          aria-label="Close"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-10">
          <Spinner className="!size-6" loading />
        </div>
      )}

      {!isLoading && !group && (
        <p className="font-inter text-sm text-v3-text-weak">Group not found.</p>
      )}

      {!isLoading && group && (
        <div className="flex flex-col gap-4">
          {group.description && (
            <p className="font-inter text-sm text-v3-text-weak">{group.description}</p>
          )}

          <div className="flex items-center justify-between">
            <span className="font-inter text-xs font-medium uppercase tracking-wide text-v3-text-weaker">
              {group.members?.length ?? 0} {group.members?.length === 1 ? "member" : "members"}
            </span>
            <Button
              type="button"
              size="sm"
              variant="bordered"
              className="h-8 rounded-full border-v3-stroke-weak px-3 font-inter text-xs font-medium text-v3-text-strong hover:bg-v3-fill-weak"
              onPress={() => open?.("add-group-members", groupId)}
              startContent={<UserPlus size={13} strokeWidth={1.5} />}
            >
              Add members
            </Button>
          </div>

          {!group.members?.length ? (
            <div className="rounded-xl border border-dashed border-v3-stroke-weak px-4 py-8 text-center">
              <p className="font-inter text-sm text-v3-text-weak">No members yet.</p>
              <p className="mt-0.5 font-inter text-xs text-v3-text-weaker">Add beneficiaries to this group.</p>
            </div>
          ) : (
            <ul className="max-h-64 space-y-1.5 overflow-y-auto">
              {group.members.map((member) => {
                const id = getMemberId(member);
                const label = isPopulatedMember(member)
                  ? member.name || member.email || id
                  : id;
                const sub = isPopulatedMember(member) && member.email && member.name !== member.email
                  ? member.email
                  : null;
                return (
                  <li
                    key={id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-v3-stroke-weak bg-white px-3 py-2.5"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-inter text-sm font-medium text-v3-text-strong">{label}</span>
                      {sub && <span className="truncate font-inter text-xs text-v3-text-weaker">{sub}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(id)}
                      className="flex shrink-0 size-7 items-center justify-center rounded-lg text-v3-text-weaker transition-colors hover:bg-danger/10 hover:text-danger"
                      aria-label="Remove member"
                    >
                      <Trash2 size={13} strokeWidth={1.5} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
