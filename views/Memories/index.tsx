"use client";

import DoubleHeartIcon from "@/public/icon/double-heart.svg";
import BookmarkIcon from "@/public/icon/dashboard/bookmark.svg";
import ConversationIcon from "@/public/icon/dashboard/conversation.svg";
import { StatCard } from "../Dashboard";
import MemoriesHeader from "./MemoryHeader";
import MemoriesGrid from "./Grid";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import { useEffect, useState } from "react";
import Table from "@/components/Table";
import MemoriesTableRow from "./Row";
import { TableRowSekeleton } from "./Skeleton";
import { storageKeys } from "@/utility/constant";
import PlusIcon from "@/public/icon/plus.svg"
import { cn } from "@/utility";
import { useModal } from "@/hooks/use-modal";

const columns = [
  { label: "topic" },
  { label: "Date created" },
  { label: "Tags", className: "min-w-32" },
  { label: "" }
]

// Empty state component for table
const TableEmptyState = () => (
  <tr>
    <td colSpan={columns.length} className="py-12">
      <div className="flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-sand-3 rounded-full flex items-center justify-center">
            <DoubleHeartIcon className="size-8 stroke-2 text-sand-10" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No stories yet</h3>
          <p className="text-gray-500 text-sm">
            Start creating your first story to see it here.
          </p>
        </div>
      </div>
    </td>
  </tr>
);

export default function Memories() {
  const [page, setPage] = useState(1)
  const [mode, setMode] = useState(localStorage.getItem(storageKeys.listmode) || "list");
  const [filter, setFilter] = useState("all");
  const { open } = useModal()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        open("search-memory");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  let filterQuery = '';
  if (filter === "bookmarked") filterQuery = "&bookmarked=true";
  if (filter === "deleted") filterQuery = "&deleted=true";

  const { data, isLoading } = useSWR(`${endpoint.stories}?page=${page}${filterQuery}`);
  const { data: stats } = useSWR(endpoint.memoriesStats);

  return (
    <div className="size-full overflow-y-auto hide-scrollbar px-4 sm:px-6 lg:px-8">
      <div className="space-y-6 sm:space-y-16 py-3 sm:py-4 lg:py-8">
        <div className="flex flex-col md:items-end md:flex-row md:justify-between gap-2">
          <div>
            <p className="font-canela font-normal text-[32px] md:text-4xl lg:text-[40px] leading-tight sm:leading-snug md:leading-[48px]">
              <span>My</span>
              <span className="text-[#412C0966] px-2 italic">stories</span>
            </p>

            <p className="font-georgia font-normal text-base sm:text-[20px] leading-[24px] tracking-[0px] text-gray-700 pt-3 rounded-md">
              Your personal journal. Add stories, images, audios - whatever, to your Memento
            </p>
          </div>

          <div>
            <button onClick={() => open("create-memory")} className={cn("btn", "!rounded-full md:w-full w-fit")}>
              <PlusIcon width={15} />
              <span>Add Memory</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          <StatCard
            icon={<DoubleHeartIcon width={23} />}
            subtitle="Stories added"
            title={stats?.data?.stories_count || 0}
          />
          <StatCard
            icon={<ConversationIcon strokeWidth={2} width={22} height={20} />}
            subtitle="Conversations"
            title={stats?.data?.conversations_count || 0}
          />
          <StatCard
            icon={<BookmarkIcon strokeWidth={2} width={14} height={18} />}
            subtitle="Bookmarks"
            title={stats?.data?.bookmark_count || 0}
          />
        </div>
      </div>
      <div className="space-y-3 sm:space-y-4 lg:space-y-6 py-3 sm:py-4 lg:py-8">
        <MemoriesHeader
          mode={mode}
          onChangeMode={setMode}
          filter={filter}
          onChangeFilter={setFilter}
        />
        {
          mode === "grid" ?
            <MemoriesGrid data={data?.data} /> :
            <div className="w-full overflow-x-auto">
              <Table
                data={data?.data}
                columns={columns}
                loading={isLoading}
                loadingRow={<TableRowSekeleton />}
                onChangePage={setPage}
                renderRow={(r, i) => <MemoriesTableRow key={i} memory={r} />}
                emptyRow={<TableEmptyState />}
              />
            </div>
        }
      </div>
    </div >
  );
}
