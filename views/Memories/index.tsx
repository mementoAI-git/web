import BookIcon from "@/public/icon/dashboard/book.svg";
import BookmarkIcon from "@/public/icon/dashboard/bookmark.svg";
import { StatCard } from "../Dashboard";
import MemoriesHeader from "./MemoryHeader";
import MemoriesGrid from "./Grid";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import { useState } from "react";
import Table from "@/components/Table";
import MemoriesTableRow from "./Row";
import { TableRowSekeleton } from "./Skeleton";
import { storageKeys } from "@/utility/constant";

const columns = [
  { label: "topic" },
  { label: "Date created" },
  { label: "Tags", className: "min-w-32" },
  { label: "" }
]

export default function Memories() {
  const [page, setPage] = useState(1)
  const [mode, setMode] = useState(localStorage.getItem(storageKeys.listmode) || "list");
  const { data, isLoading } = useSWR(`${endpoint.memories}?page=${page}`);
  const { data: stats } = useSWR(endpoint.memoriesStats);

  return (
    <div className="size-full overflow-y-auto hide-scrollbar">
      <div className="space-y-4 py-8">
        <div className="flex items-center gap-2">
          <span className="font-inter text-xl leading-[30px] font-semibold">
            Stats
          </span>
          <div className="flex-1 border-t border-[#EBEBEB]" />
        </div>
        <div className="flex items-center gap-3">
          <StatCard
            icon={<BookIcon width={20} height={16} />}
            subtitle="memories added"
            title={stats?.data?.memory_count || 0}
          />
          <StatCard
            icon={<BookmarkIcon width={14} height={18} />}
            subtitle="bookmarks"
            title={stats?.data?.bookmark_count || 0}
          />
        </div>
      </div>
      <div className="space-y-6 py-8">
        <MemoriesHeader
          mode={mode}
          onChangeMode={setMode}
          count={data?.data?.totalDocs}
        />
        {
          mode === "grid" ?
            <MemoriesGrid data={data?.data} /> :
            <Table
              data={data?.data}
              columns={columns}
              loading={isLoading}
              loadingRow={<TableRowSekeleton />}
              onChangePage={setPage}
              renderRow={(r, i) => <MemoriesTableRow key={i} memory={r} />}
            />
        }
      </div>
    </div>
  );
}
