import endpoint from "@/api/endpoint";
import { useModal } from "@/hooks/use-modal";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { StatCard } from "../component/stat-card";
import { DoubleHeartIcon, PlusIcon } from "@/components/icons";

import totalMemoriesBg from "@/assets/icon/total-memories.svg";
import mediaFilesBg from "@/assets/icon/media-files.svg";
import favouritesCardBg from "@/assets/icon/favourites-card.svg";
import storageCardBg from "@/assets/icon/storage-card.svg";

import Table from "@/components/table";
import { storageKeys } from "@/utility/constant";
import StoriesHeader from "./components/header";
import StoriesGrid from "./components/grid";
import { TableRowSekeleton } from "./components/skeleton";
import StoriesTableRow from "./components/row";
import type { IMemory } from "@/utility/interface";

const columns = [
  { label: "topic" },
  { label: "Date created" },
  { label: "Tags", className: "min-w-32" },
  { label: "" },
];

const TableEmptyState = () => (
  <tr>
    <td colSpan={columns.length} className="py-12">
      <div className="flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-sand-3 rounded-full flex items-center justify-center">
            <DoubleHeartIcon className="size-8 stroke-2 text-sand-10" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No stories yet
          </h3>
          <p className="text-gray-500 text-sm">
            Start creating your first story to see it here.
          </p>
        </div>
      </div>
    </td>
  </tr>
);

export default function StoriesPage() {
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState(
    localStorage.getItem(storageKeys.listmode) || "list",
  );
  const [filter, setFilter] = useState("all");
  const { open } = useModal();

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

  let filterQuery = "";
  if (filter === "bookmarked") filterQuery = "&bookmarked=true";
  if (filter === "deleted") filterQuery = "&deleted=true";

  const { data, isLoading } = useSWR(
    `${endpoint.stories}?page=${page}${filterQuery}`,
  );
  const { data: stats } = useSWR(endpoint.memoriesStats);

  return (
    <div className="page-viewport hide-scrollbar">
      <div className="size-full overflow-y-auto hide-scrollbar px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 sm:space-y-16 py-3 sm:py-4 lg:py-8">
          <div className="flex flex-col md:items-end md:flex-row md:justify-between gap-2">
            <div>
              <p className="font-garamond font-medium text-[32px] md:text-4xl lg:text-[40px] leading-tight sm:leading-snug md:leading-[48px] text-gray-900">
                My Memories
              </p>
              <p className="font-inter font-normal text-base text-gray-500 pt-2">
                Add stories, images, audios - whatever, to your Memento
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => open("memory-insights")}
                className="flex items-center h-9 sm:h-12 px-3 sm:px-5 rounded-full font-inter font-semibold text-xs sm:text-sm text-[#101828] cursor-pointer transition-opacity hover:opacity-90 whitespace-nowrap"
                style={{
                  backgroundColor: "#F9F9F9",
                  border: "1px solid rgba(0,0,0,0.05)",
                }}
              >
                View insights
              </button>
              <button
                onClick={() => open("create-memory")}
                className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-12 px-3 sm:px-5 rounded-full font-inter font-semibold text-xs sm:text-sm text-white cursor-pointer transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#FF5E00" }}
              >
                <PlusIcon className="size-3 sm:size-4 shrink-0" />
                <span className="whitespace-nowrap">Add memory</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              bgImage={totalMemoriesBg as unknown as string}
              subtitle="Total Memories"
              title={stats?.data?.stories_count || 0}
              unit="items"
              variant="blue"
            />
            <StatCard
              bgImage={mediaFilesBg as unknown as string}
              subtitle="Media Files"
              title={stats?.data?.media_count || 0}
              unit="items"
              variant="pink"
            />
            <StatCard
              bgImage={favouritesCardBg as unknown as string}
              subtitle="Favourites"
              title={stats?.data?.bookmark_count || 0}
              unit="items"
              variant="orange"
            />
            <StatCard
              bgImage={storageCardBg as unknown as string}
              subtitle="Storage"
              title={stats?.data?.storage || "0/0GB"}
              unit="used"
              variant="green"
            />
          </div>
        </div>
        <div className="space-y-6 sm:space-y-8 lg:space-y-10 py-3 sm:py-4 lg:py-8">
          <StoriesHeader
            mode={mode}
            onChangeMode={setMode}
            filter={filter}
            onChangeFilter={setFilter}
            count={stats?.data?.stories_count || 0}
          />
          {mode === "grid" ? (
            <StoriesGrid data={data?.data} />
          ) : (
            <div className="w-full overflow-x-auto">
              <Table
                data={data?.data}
                columns={columns}
                loading={isLoading}
                loadingRow={<TableRowSekeleton />}
                onChangePage={setPage}
                renderRow={(r, i) => (
                  <StoriesTableRow key={i} memory={r as IMemory} />
                )}
                emptyRow={<TableEmptyState />}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
