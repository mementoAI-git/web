import endpoint from "@/api/endpoint";
import { useModal } from "@/hooks/use-modal";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { StatCard } from "../component/stat-card";
import { DoubleHeartIcon } from "@/components/icons";

import totalMemoriesBg from "@/assets/icon/total-memories.svg";
import mediaFilesBg from "@/assets/icon/media-files.svg";
import favouritesCardBg from "@/assets/icon/favourites-card.svg";
import storageCardBg from "@/assets/icon/storage-card.svg";

import Table from "@/components/table";
import { storageKeys } from "@/utility/constant";
import StoriesHeader, { StoriesFilters } from "./components/header";
import StoriesGrid from "./components/grid";
import { TableRowSekeleton } from "./components/skeleton";
import { StoriesMobileList } from "./components/list-mobile";
import StoriesTableRow from "./components/row";
import type { IMemory, IPagination } from "@/utility/interface";
import {
  TypographyH1,
  TypographyH2,
  TypographyLead,
  TypographyMuted,
} from "@/components/ui/typography";
import { useDashboardHeaderActions } from "@/contexts/dashboard-header-actions";
import { StoriesActionButtons } from "./components/stories-action-buttons";
import { paginatedResponseFetcher } from "@/api/domain-fetchers";

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
          <div className="w-16 h-16 mx-auto mb-4 bg-v3-fill-weaker rounded-full flex items-center justify-center">
            <DoubleHeartIcon className="size-8 stroke-2 text-v3-text-weaker" />
          </div>
          <TypographyH2 className="mb-2 text-lg text-v3-text-strong">
            No stories yet
          </TypographyH2>
          <TypographyMuted className="text-v3-text-weak">
            Start creating your first story to see it here.
          </TypographyMuted>
        </div>
      </div>
    </td>
  </tr>
);

const MobileListEmptyState = () => (
  <div className="flex flex-col items-center justify-center rounded-[20px] border border-v3-stroke-weak bg-white px-6 py-12 text-center shadow-sm">
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-v3-fill-weaker">
      <DoubleHeartIcon className="size-8 stroke-2 text-v3-text-weaker" />
    </div>
    <TypographyH2 className="mb-2 text-lg text-v3-text-strong">
      No stories yet
    </TypographyH2>
    <TypographyMuted className="text-v3-text-weak">
      Start creating your first story to see it here.
    </TypographyMuted>
  </div>
);

export default function StoriesPage() {
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState(
    localStorage.getItem(storageKeys.listmode) || "list",
  );
  const [filter, setFilter] = useState("all");
  const [canPromoteActionsToNav, setCanPromoteActionsToNav] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1280 : true,
  );
  const { open } = useModal();
  const { setShowStoriesActions } = useDashboardHeaderActions();

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

  const { data: userStatsData } = useSWR(endpoint.userStats);
  const hasQuickPending = useMemo(
    () => Number(userStatsData?.data?.quick_capture_pending_count) > 0,
    [userStatsData?.data?.quick_capture_pending_count],
  );

  const { data, isLoading } = useSWR(
    mode === "list" ? `${endpoint.stories}?page=${page}${filterQuery}` : null,
    {
      refreshInterval: hasQuickPending ? 4000 : 0,
    },
  );

  const getGridPageKey = useCallback(
    (
      pageIndex: number,
      previousPageData: { data?: IPagination<IMemory> } | null,
    ) => {
      if (mode !== "grid") return null;
      if (previousPageData && !previousPageData.data?.hasNextPage) return null;

      return `${endpoint.stories}?page=${pageIndex + 1}${filterQuery}`;
    },
    [filterQuery, mode],
  );

  const {
    data: gridPages,
    isLoading: isGridLoading,
    size: gridPageCount,
    setSize: setGridPageCount,
  } = useSWRInfinite(
    getGridPageKey,
    paginatedResponseFetcher<IMemory>,
    {
      refreshInterval: hasQuickPending ? 4000 : 0,
      revalidateFirstPage: hasQuickPending,
      revalidateOnFocus: false,
    },
  );

  const gridData = useMemo(() => {
    const lastPage = gridPages?.[gridPages.length - 1]?.data;
    if (!lastPage) return undefined;

    return {
      ...lastPage,
      docs: gridPages.flatMap((gridPage) => gridPage.data?.docs ?? []),
    };
  }, [gridPages]);
  const isGridLoadingMore = Boolean(
    isGridLoading ||
      (gridPageCount > 0 && gridPages && !gridPages[gridPageCount - 1]),
  );
  const gridHasMore = Boolean(gridData?.hasNextPage);
  const loadMoreGridStories = useCallback(() => {
    void setGridPageCount((currentSize) => currentSize + 1);
  }, [setGridPageCount]);
  const { data: stats } = useSWR(endpoint.memoriesStats);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 1280px)");
    const sync = () => setCanPromoteActionsToNav(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);

    return () => {
      mediaQuery.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    setShowStoriesActions(canPromoteActionsToNav);

    return () => {
      setShowStoriesActions(false);
    };
  }, [canPromoteActionsToNav, setShowStoriesActions]);

  useEffect(() => () => setShowStoriesActions(false), [setShowStoriesActions]);

  return (
    <div className="page-viewport hide-scrollbar mx-0 w-full max-w-none overflow-hidden">
      <div
        data-slot="stories-workspace"
        className="hide-scrollbar size-full min-h-0 w-full overflow-y-auto px-4"
      >
        <div className="flex w-full max-w-none flex-col gap-6 py-4 lg:gap-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between xl:hidden">
            <div>
              <TypographyH1 className="font-garamond font-normal text-[32px] leading-tight text-v3-text-strong sm:leading-snug md:text-4xl md:leading-[48px] lg:text-[40px]">
                My stories
              </TypographyH1>
              <TypographyLead className="pt-2 font-inter font-normal text-v3-text-weak">
                Add stories, images, audios - whatever, to your Memento
              </TypographyLead>
            </div>

            <div>
              <StoriesActionButtons
                onViewInsights={() => open("memory-insights")}
                onCreateMemory={() => open("create-memory")}
                onQuickCapture={() => open("quick-capture")}
              />
            </div>
          </div>

          <StoriesHeader
            mode={mode}
            onChangeMode={setMode}
          />

          <div data-slot="stories-catalog" className="flex flex-col">
            <section
              data-slot="memory-statistics"
              aria-label="Memory statistics"
            >
              <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3">
                <StatCard
                  compact
                  bgImage={totalMemoriesBg as unknown as string}
                  subtitle="Total Memories"
                  title={stats?.data?.stories_count || 0}
                  unit="items"
                  variant="blue"
                />
                <StatCard
                  compact
                  bgImage={mediaFilesBg as unknown as string}
                  subtitle="Media Files"
                  title={stats?.data?.media_count || 0}
                  unit="items"
                  variant="pink"
                />
                <StatCard
                  compact
                  bgImage={favouritesCardBg as unknown as string}
                  subtitle="Favourites"
                  title={stats?.data?.bookmark_count || 0}
                  unit="items"
                  variant="orange"
                />
                <StatCard
                  compact
                  bgImage={storageCardBg as unknown as string}
                  subtitle="Storage"
                  title={stats?.data?.storage || "0/0GB"}
                  unit="used"
                  variant="green"
                />
              </div>
            </section>

            <div data-slot="stories-filter-region" className="mt-6">
              <StoriesFilters
                filter={filter}
                onChangeFilter={setFilter}
                count={stats?.data?.stories_count || 0}
                bookmarkedCount={stats?.data?.stories_bookmarked_count || 0}
                deletedCount={stats?.data?.stories_deleted_count || 0}
              />
            </div>

            <div data-slot="stories-results" className="mt-4">
              {mode === "grid" ? (
                <StoriesGrid
                  data={gridData}
                  hasMore={gridHasMore}
                  isLoadingMore={isGridLoadingMore}
                  onLoadMore={loadMoreGridStories}
                />
              ) : (
                <>
                  <div className="sm:hidden">
                    <StoriesMobileList
                      data={data?.data}
                      loading={isLoading}
                      onChangePage={setPage}
                      emptyState={<MobileListEmptyState />}
                    />
                  </div>
                  <div className="hidden sm:block w-full overflow-x-auto">
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
