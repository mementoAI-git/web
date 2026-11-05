"use client";

import { useRef, useState } from "react";
import dayjs from "dayjs";
import { Settings2, UserPlus } from "lucide-react";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";
import { fetcher } from "@/api/fetcher";
import { groupDetailKey, removeGroupMember } from "@/api/groups";
import type { IResponse } from "@/api/interface";
import { groupColorVar } from "@/components/group-color";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { useModal } from "@/hooks/use-modal";
import { useRequestRecovery } from "@/hooks/use-request-recovery";
import { SettingsSubpage } from "@/pages/dashboard/settings/settings-subpage";
import type { IGroup, IGroupMember, IPagination } from "@/utility/interface";
import { SETTINGS_BENEFICIARIES_SWR_KEY } from "../beneficiaries-list-swr-key";
import type { IBeneficiaryWithGroups } from "../beneficiary/beneficiary-types";
import { PersonCard } from "../person-card";

const backProps = {
  backTo: "/settings/beneficiary?view=groups",
  backLabel: "Back to groups",
};

export function GroupDetailPage({ groupId }: { groupId: string }) {
  const { open } = useModal();
  const key = groupDetailKey(groupId);
  const {
    data: response,
    error,
    isLoading,
    mutate: revalidate,
  } = useSWR<IResponse>(key, fetcher, { shouldRetryOnError: false });
  const { data: peopleData } = useSWR<{
    data?: IPagination<IBeneficiaryWithGroups>;
  }>(SETTINGS_BENEFICIARIES_SWR_KEY, { shouldRetryOnError: false });
  const group = response?.data as IGroup | undefined;
  const retry = useRequestRecovery(
    `group-detail:${groupId}`,
    error,
    revalidate,
    "Couldn’t load this group. Please try again.",
  );
  const pending = useRef(false);
  const [removing, setRemoving] = useState(false);

  const removeMember = async (memberId: string) => {
    if (pending.current || !memberId) return;
    pending.current = true;
    setRemoving(true);
    try {
      const result = await removeGroupMember(groupId, memberId);
      if (result?.success) {
        toast.success(result.message || "Member removed");
        await revalidate();
        void mutate(
          (k) => typeof k === "string" && k.startsWith("/groups") && k !== key,
        ).catch(() => undefined);
      }
    } catch {
      /* Mutation transport reports the failure through a toast. */
    } finally {
      pending.current = false;
      setRemoving(false);
    }
  };

  if (isLoading && !group) {
    return (
      <SettingsSubpage title="Group" {...backProps}>
        <div role="status" aria-label="Loading group" className="flex justify-center py-12">
          <Spinner className="size-5" />
        </div>
      </SettingsSubpage>
    );
  }
  if (!group) {
    return (
      <SettingsSubpage title="Group" {...backProps}>
        {error ? (
          <Button variant="outline" className="self-start" onClick={retry}>
            Retry loading group
          </Button>
        ) : (
          <p className="text-sm text-text-neutral-weak">This group no longer exists.</p>
        )}
      </SettingsSubpage>
    );
  }

  const people = peopleData?.data?.docs ?? [];
  const members = (group.members ?? []).map((member) => {
    const id = typeof member === "string" ? member : (member._id ?? "");
    const person = people.find((value) => value._id === id);
    const populated: Partial<IGroupMember> =
      typeof member === "string" ? {} : member;
    return {
      id,
      name: populated.name || person?.name || "",
      email: populated.email || person?.email || "",
      relationship: populated.relationship || person?.relationship,
      user: person?.user,
    };
  });
  const count = members.length;

  return (
    <SettingsSubpage title={group.name} {...backProps}>
      <div className="flex flex-col gap-10">
        <section
          aria-label="Group summary"
          className="flex items-center justify-between gap-4 rounded-2xl p-6 text-[var(--group-on-color)]"
          style={{ backgroundColor: groupColorVar(group.color) }}
        >
          <div className="min-w-0">
            <p className="truncate text-xl font-bold">{group.name}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm">
              {group.created_at ? (
                <>
                  Created {dayjs(group.created_at).format("MMM D, YYYY")}
                  <span aria-hidden className="size-1 rounded-full bg-current" />
                </>
              ) : null}
              {count} {count === 1 ? "person" : "people"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Group settings"
            className="rounded-full bg-[color-mix(in_srgb,var(--group-on-color)_10%,transparent)] text-[var(--group-on-color)] hover:bg-[color-mix(in_srgb,var(--group-on-color)_18%,transparent)] hover:text-[var(--group-on-color)] dark:hover:bg-[color-mix(in_srgb,var(--group-on-color)_18%,transparent)]"
            onClick={() => open("update-group", group)}
          >
            <Settings2 aria-hidden />
          </Button>
        </section>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-medium text-text-neutral-strong">
              Group members
            </h3>
            <Button
              variant="ghost"
              className="h-11 rounded-full bg-fill-neutral-weak px-4 text-xs font-semibold text-text-neutral-strong [&_svg]:size-5"
              onClick={() => open("add-group-members", groupId)}
            >
              <UserPlus aria-hidden />
              Add new person
            </Button>
          </div>
          {count === 0 ? (
            <div className="settings-card px-4 py-10 text-center">
              <p className="text-sm font-medium text-text-neutral-strong">No members yet</p>
              <p className="mt-1 text-sm text-text-neutral-weak">Add people from your connections.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {members.map((member) => (
                <li key={member.id}>
                  <PersonCard
                    name={member.name || member.email || "Unknown person"}
                    email={member.email}
                    user={member.user}
                    details={[member.relationship]}
                    menu={
                      <DropdownMenuItem
                        disabled={removing}
                        className="text-text-error-strong focus:text-text-error-strong"
                        onSelect={() => void removeMember(member.id)}
                      >
                        Remove from group
                      </DropdownMenuItem>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </SettingsSubpage>
  );
}
