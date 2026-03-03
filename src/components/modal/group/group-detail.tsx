"use client";

import { ModalCloseBtn } from "../modalLayout";
import { useModal } from "@/hooks/use-modal";
import Spinner from "@/components/spinner";
import { toast } from "sonner";
import { mutate } from "swr";
import useSWR from "swr";
import { fetcher } from "@/api/fetcher";
import type { IResponse } from "@/api/interface";
import type { IGroup, IGroupMember } from "@/utility/interface";
import { groupDetailKey, removeGroupMember } from "@/api/groups";
import { PlusIcon, TrashIcon } from "@/components/icons";

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

  const handleAddMembers = () => {
    open?.("add-group-members", groupId);
  };

  if (!groupId) return null;

  return (
    <div className="modal-container max-w-lg">
      <ModalCloseBtn onClick={() => close?.("group-detail")} />
      <div className="space-y-6">
        <h4 className="modal-title">Group details</h4>
        {isLoading && (
          <div className="flex justify-center py-8">
            <Spinner className="!size-8" loading />
          </div>
        )}
        {!isLoading && !group && (
          <p className="font-inter text-sm text-gray-500">Group not found.</p>
        )}
        {!isLoading && group && (
          <>
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
              <p className="font-inter text-sm font-semibold text-gray-950/90">{group.name}</p>
              {group.description ? (
                <p className="mt-1 font-inter text-xs text-gray-600">{group.description}</p>
              ) : null}
            </div>
            <div className="flex items-center justify-between">
              <span className="font-inter text-sm font-medium text-gray-700">Members</span>
              <button type="button" onClick={handleAddMembers} className="btn flex items-center gap-2 !rounded-lg">
                <PlusIcon width={14} height={14} />
                Add members
              </button>
            </div>
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {!group.members?.length ? (
                <li className="font-inter text-sm text-gray-500">No members yet. Add beneficiaries to this group.</li>
              ) : (
                group.members.map((member) => {
                  const id = getMemberId(member);
                  const label = isPopulatedMember(member)
                    ? member.name || member.email || id
                    : id;
                  return (
                    <li
                      key={id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2"
                    >
                      <span className="font-inter text-sm text-gray-800 truncate">{label}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(id)}
                        className="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-danger"
                        aria-label="Remove member"
                      >
                        <TrashIcon width={14} height={14} />
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
