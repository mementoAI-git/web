"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import { ChevronRight, MoreHorizontal, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModal } from "@/hooks/use-modal";
import { useRequestRecovery } from "@/hooks/use-request-recovery";
import { Spinner } from "@/components/ui/spinner";
import { groupColorVar } from "@/components/group-color";
import type { IGroup, IPagination } from "@/utility/interface";
import { groupsListKey, groupsListFetcher } from "@/api/groups";

export default function GroupManagement({
  compact = false,
}: {
  /** The chat People panel's list, which opens groups in modals. */
  compact?: boolean;
}) {
  const { open } = useModal();
  const [page, setPage] = useState(1);
  const { data, isLoading, error, mutate, isValidating } = useSWR<
    IPagination<IGroup>
  >(groupsListKey(page), groupsListFetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const docs = data?.docs ?? [];
  const totalPages = data?.totalPages ?? 1;

  const retry = useRequestRecovery(
    `settings-groups:${page}`,
    error,
    mutate,
    "We couldn’t load your groups. Please try again.",
  );
  const retryControl = error ? (
    <Button
      variant="outline"
      className="self-start"
      onClick={retry}
      disabled={isValidating}
    >
      Retry loading groups
    </Button>
  ) : null;
  const recoverPage = Boolean(data && !error && !docs.length && page > 1);
  useEffect(() => {
    if (recoverPage)
      setPage((current) => Math.max(1, Math.min(current - 1, totalPages)));
  }, [recoverPage, totalPages]);

  if ((isLoading && !data) || recoverPage) {
    return (
      <div
        role="status"
        aria-label="Loading groups"
        className="flex items-center justify-center py-12"
      >
        <Spinner className="size-5" />
      </div>
    );
  }

  if (error && !data) return retryControl;

  if (!docs.length) {
    return (
      <div
        className={
          compact
            ? "flex flex-col items-center rounded-3xl border border-dashed border-stroke-neutral-weak bg-fill-neutral-weak px-4 py-10 text-center"
            : "settings-card flex flex-col items-center px-4 py-10 text-center"
        }
      >
        {retryControl}
        <p className="text-sm font-medium text-text-neutral-strong">
          No groups yet
        </p>
        <p className="mt-1 text-sm text-text-neutral-weak">
          Create a group to organize your people.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {retryControl}
      {compact ? (
        <div className="space-y-1">
          {docs.map((group) => (
            <div
              key={group._id}
              className="flex items-center gap-3 rounded-2xl p-3 hover:bg-fill-neutral-weak"
            >
              <button
                type="button"
                onClick={() => open?.("group-detail", group._id)}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-fill-neutral-weak">
                  <Users className="size-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-base font-medium">
                    {group.name}
                  </span>
                  <span className="block text-sm text-text-neutral-weaker">
                    {group.members?.length ?? 0}{" "}
                    {group.members?.length === 1 ? "member" : "members"}
                  </span>
                </span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full"
                    aria-label={`Options for ${group.name}`}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="people-menu">
                  <DropdownMenuItem
                    onSelect={() => open?.("group-detail", group._id)}
                  >
                    View members
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => open?.("update-group", group)}
                  >
                    Edit group
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => open?.("delete-group", group._id)}
                  >
                    Remove group
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      ) : (
      <ul className="flex flex-col gap-4">
        {docs.map((group) => {
          const count = group.members?.length ?? 0;
          return (
            <li key={group._id}>
              <Link
                to={`/settings/beneficiary?group=${group._id}`}
                className="settings-card settings-row items-start p-4"
              >
                <span className="flex min-w-0 items-start gap-4">
                  <span
                    aria-hidden
                    className="size-6 shrink-0 rounded-md"
                    style={{ backgroundColor: groupColorVar(group.color) }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-xl font-bold text-text-neutral-strong">
                      {group.name || "Untitled group"}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-text-neutral-weak">
                      {group.created_at ? (
                        <>
                          Created {dayjs(group.created_at).format("MMM D, YYYY")}
                          <span aria-hidden className="size-1 rounded-full bg-current" />
                        </>
                      ) : null}
                      {count} {count === 1 ? "person" : "people"}
                    </span>
                  </span>
                </span>
                <ChevronRight
                  className="size-5 shrink-0 text-icon-neutral-strong"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous page
          </Button>
          <span className="text-sm text-text-neutral-weak">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            disabled={page >= totalPages}
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
          >
            Next page
          </Button>
        </div>
      )}
    </div>
  );
}
