"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import useSWR from "swr";
import { Spinner } from "@/components/ui/spinner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { MoreHorizontal } from "lucide-react";
import dayjs from "dayjs";
import type { IGroup, IPagination } from "@/utility/interface";
import { groupsListKey, groupsListFetcher } from "@/api/groups";
import { useModal } from "@/hooks/use-modal";
import { GROUP_COLORS } from "@/utility/constant";
import { cn } from "@/utility";

interface RowMenuProps {
  group: IGroup;
  onViewMembers: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function RowMenu({ group: _group, onViewMembers, onEdit, onDelete }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.right - 160 });
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const items = [
    { label: "View members", action: onViewMembers },
    { label: "Edit group", action: onEdit },
    { label: "Remove group", action: onDelete, danger: true },
  ];

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggleMenu}
        className="flex size-7 items-center justify-center rounded-lg text-v3-text-weaker transition-colors hover:bg-v3-fill-weak hover:text-v3-text-strong focus-visible:outline-none"
        aria-label="Group options"
      >
        <MoreHorizontal size={15} strokeWidth={1.5} />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{ top: pos.top, left: pos.left, width: 160 }}
          className="fixed z-[9999] overflow-hidden rounded-xl border border-v3-stroke-weak bg-white py-1 shadow-lg"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => { setOpen(false); item.action(); }}
              className={cn(
                "w-full px-3 py-2 text-left font-inter text-sm transition-colors hover:bg-v3-fill-weaker",
                item.danger ? "text-danger" : "text-v3-text-strong",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

export default function GroupManagement() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSWR<IPagination<IGroup>>(groupsListKey(page), groupsListFetcher, {
    revalidateOnFocus: false,
  });
  const { open } = useModal();

  const docs = data?.docs ?? [];
  const totalPages = data?.totalPages ?? 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-5" />
      </div>
    );
  }

  if (!docs.length) {
    return (
      <div className="rounded-xl border border-dashed border-v3-stroke-weak px-4 py-10 text-center">
        <p className="font-inter text-sm font-medium text-v3-text-strong">No groups yet</p>
        <p className="mt-1 font-inter text-sm text-v3-text-weak">
          Create a group to organize your beneficiaries.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border border-v3-stroke-weak">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-v3-fill-weaker">
              <th className="px-4 py-2.5 text-left font-inter text-[11px] font-semibold uppercase tracking-wide text-v3-text-weaker">Group name</th>
              <th className="px-4 py-2.5 text-left font-inter text-[11px] font-semibold uppercase tracking-wide text-v3-text-weaker">Date created</th>
              <th className="px-4 py-2.5 text-left font-inter text-[11px] font-semibold uppercase tracking-wide text-v3-text-weaker">Description</th>
              <th className="px-4 py-2.5 text-left font-inter text-[11px] font-semibold uppercase tracking-wide text-v3-text-weaker">Members</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {docs.map((group) => {
              const colorClass = GROUP_COLORS[Math.min(group.color ?? 0, GROUP_COLORS.length - 1)];
              return (
                <tr key={group._id} className="border-t border-v3-stroke-weak">
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex max-w-[160px] items-center truncate rounded-full border px-2.5 py-1 font-inter text-xs font-medium",
                        colorClass,
                      )}
                    >
                      {group.name || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-inter text-xs text-v3-text-weak">
                    {group.created_at ? dayjs(group.created_at).format("MMM D, YYYY") : "—"}
                  </td>
                  <td className="px-4 py-3 font-inter text-xs text-v3-text-weak">
                    <span className="block max-w-[200px] truncate">
                      {group.description || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-inter text-xs text-v3-text-strong">
                    <span className="font-medium tabular-nums">
                      {Array.isArray(group.members) ? group.members.length : 0}
                      <span className="ml-1 font-normal text-v3-text-weak">
                        {Array.isArray(group.members) && group.members.length === 1 ? "member" : "members"}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RowMenu
                      group={group}
                      onViewMembers={() => open?.("group-detail", group._id)}
                      onEdit={() => open?.("update-group", group)}
                      onDelete={() => open?.("delete-group", group._id)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center pt-1">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }}
                  aria-disabled={page <= 1}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={p === page}
                    onClick={(e) => { e.preventDefault(); setPage(p); }}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }}
                  aria-disabled={page >= totalPages}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
