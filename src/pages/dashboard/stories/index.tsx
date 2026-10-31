import { MEMORY_CHANGED_EVENT } from "@/api/memory-lifecycle";
import { MotionHeading } from "@/components/motion/text-reveal";
import { useTextReveal } from "@/components/motion/use-text-reveal";
import "./stories-motion.css";
import endpoint from "@/api/endpoint";
import { useModal } from "@/hooks/use-modal";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import useSWRInfinite from "swr/infinite";
import { StatCard } from "../component/stat-card";

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
  TypographyLead,
} from "@/components/ui/typography";
import { useDashboardHeaderActions } from "@/contexts/dashboard-header-actions";
import { StoriesActionButtons } from "./components/stories-action-buttons";
import { paginatedResponseFetcher } from "@/api/domain-fetchers";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Bookmark, Plus, Trash2 } from "lucide-react";
import { useSubscription } from "@/contexts/subscription";
import { formatStorageSummary } from "@/features/pricing/storage-display";

const columns = [
  { label: "topic" },
  { label: "Date created" },
  { label: "Tags", className: "min-w-32" },
  { label: "" },
];

const StoriesEmptyState = ({ filter, onViewAll }: { filter: string; onViewAll: () => void }) => {
  const { open } = useModal();
  const isAll = filter === "all";
  const isBookmarked = filter === "bookmarked";
  return (
    <Empty className="stories-list-surface stories-empty-surface rounded-xl border border-stroke-neutral-weak p-6 sm:p-8">
      <EmptyHeader>
        <EmptyMedia>{isAll ? <span aria-hidden="true" className="text-4xl">🍄</span> : isBookmarked ? <Bookmark aria-hidden="true" className="size-8" /> : <Trash2 aria-hidden="true" className="size-8" />}</EmptyMedia>
        <EmptyTitle>{isAll ? "No stories yet" : isBookmarked ? "No bookmarked stories" : "No deleted stories"}</EmptyTitle>
        <EmptyDescription>{isAll ? "Start creating your first story to see it here." : isBookmarked ? "Bookmark stories to keep your favourites here." : "Deleted stories stay here for 30 days. Restore them before they are permanently removed."}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="lg" onClick={() => isAll ? open("create-memory") : onViewAll()}>
          {isAll && <Plus data-icon="inline-start" aria-hidden="true" />}
          {isAll ? "Add memory" : "View all stories"}
        </Button>
      </EmptyContent>
    </Empty>
  );
};

export default function StoriesPage() {
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState(
    localStorage.getItem(storageKeys.listmode) || "list",
  );
  const [filter, setFilter] = useState("all");
  const changeFilter = useCallback((next: string) => {
    if (next === filter) return;
    setPage(1);
    setFilter(next);
  }, [filter]);
  const [canPromoteActionsToNav, setCanPromoteActionsToNav] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1280 : true,
  );
  const { open } = useModal();
  const { summary, usage, isProOrAbove } = useSubscription();
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

  const { data, isLoading, error: listError, mutate: refreshList } = useSWR(
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
    error: gridError,
    size: gridPageCount,
    setSize: setGridPageCount,
    mutate: refreshGrid,
  } = useSWRInfinite(
    getGridPageKey,
    paginatedResponseFetcher<IMemory>,
    {
      refreshInterval: hasQuickPending ? 4000 : 0,
      revalidateFirstPage: true,
      revalidateOnFocus: false,
      persistSize: false,
    },
  );

  useEffect(() => {
    const refresh = () => { void refreshGrid?.().catch(() => undefined); };
    window.addEventListener(MEMORY_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(MEMORY_CHANGED_EVENT, refresh);
  }, [refreshGrid]);

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
    if (gridError) return;
    void setGridPageCount((currentSize) => currentSize + 1).catch(() => undefined);
  }, [gridError, setGridPageCount]);
  const { data: stats } = useSWR(endpoint.memoriesStats);

  const pagination = data?.data as IPagination<IMemory> | undefined;
  const lastPage = typeof pagination?.totalPages === "number" && Number.isFinite(pagination.totalPages)
    ? Math.max(1, pagination.totalPages) : page;
  const recoveryPage = mode === "list" && !listError && !isLoading && pagination && page > 1
    ? page > lastPage ? lastPage : pagination.docs?.length === 0 ? page - 1 : null
    : null;
  useEffect(() => {
    if (recoveryPage !== null) setPage(recoveryPage);
  }, [recoveryPage]);
  const listLoading = isLoading || recoveryPage !== null;

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

  const resultsRef = useRef<HTMLDivElement>(null);
  const requestFailed = Boolean(mode === "grid" ? gridError : listError);
  const retryStories = useCallback(() => {
    void (mode === "grid" ? refreshGrid() : refreshList()).catch(() => undefined);
  }, [mode, refreshGrid, refreshList]);
  const requestScope = `${mode}:${filter}:${mode === "list" ? page : "pages"}`;
  useEffect(() => {
    if (!requestFailed) return;
    const id = toast.error("Stories couldn’t be loaded. Try again.", {
      id: "stories-request-failure",
      action: { label: "Retry", onClick: retryStories },
    });
    return () => { toast.dismiss(id); };
  }, [requestFailed, requestScope, retryStories]);
  const hasResults = mode === "grid" ? Boolean(gridData?.docs.length) : Boolean(pagination?.docs?.length);
  const resultsLoading = !requestFailed && !hasResults && (mode === "grid" ? isGridLoading : listLoading);
  const emptyState = <StoriesEmptyState filter={filter} onViewAll={() => changeFilter("all")} />;
  useTextReveal(resultsRef, `${mode}:${filter}:${page}:${resultsLoading}`);

  return (
    <div className="stories-motion page-viewport hide-scrollbar mx-auto w-full max-w-[1900px]! overflow-hidden">
      <div
        data-slot="stories-workspace"
        className="hide-scrollbar size-full min-h-0 w-full overflow-y-auto px-4"
      >
        <div className="flex min-h-full w-full max-w-none flex-col gap-6 py-4 lg:gap-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between xl:hidden">
            <MotionHeading>
              <TypographyH1 className="t-stagger-line font-garamond font-normal text-[32px] leading-tight text-v3-text-strong sm:leading-snug md:text-4xl md:leading-[48px] lg:text-[40px]">
                My stories
              </TypographyH1>
              <TypographyLead className="t-stagger-line t-stagger-line--2 pt-2 font-inter font-normal text-v3-text-weak">
                Add stories, images, audios - whatever, to your Memento
              </TypographyLead>
            </MotionHeading>

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

          <div data-slot="stories-catalog" className="flex flex-1 flex-col">
            <section
              hidden
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
                  title={summary ? formatStorageSummary(usage, isProOrAbove, stats?.data?.storage) : "—"}
                  unit="used"
                  variant="green"
                />
              </div>
            </section>

            <div data-slot="stories-filter-region">
              <StoriesFilters
                filter={filter}
                onChangeFilter={changeFilter}
                count={stats?.data?.stories_count || 0}
                bookmarkedCount={stats?.data?.stories_bookmarked_count || 0}
                deletedCount={stats?.data?.stories_deleted_count || 0}
              />
            </div>

            <div ref={resultsRef} data-slot="stories-results" data-loading={resultsLoading} aria-busy={resultsLoading} className="stories-results-reveal mt-4 flex flex-1 flex-col">
              {requestFailed && !hasResults ? (
                <div className="stories-list-surface flex min-h-48 items-center justify-center rounded-xl border border-stroke-neutral-weak p-6">
                  <Button variant="outline" onClick={retryStories}>Retry loading stories</Button>
                </div>
              ) : mode === "grid" ? (
                !isGridLoading && gridData?.docs.length === 0 ? (
                  emptyState
                ) : (
                  <StoriesGrid
                    data={gridData}
                    hasMore={gridHasMore && !requestFailed}
                    isLoadingMore={isGridLoadingMore && !requestFailed}
                    onLoadMore={loadMoreGridStories}
                    onRetry={requestFailed ? retryStories : undefined}
                  />
                )
              ) : (
                !listLoading && data?.data?.docs?.length === 0 ? (
                  emptyState
                ) : <>
                  <div className="sm:hidden">
                    <StoriesMobileList
                      data={data?.data}
                      loading={listLoading && !hasResults}
                      onChangePage={setPage}
                      emptyState={emptyState}
                    />
                  </div>
                  <div className="hidden sm:block w-full overflow-x-auto">
                    <Table
                      className="stories-table"
                      data={data?.data}
                      columns={columns.map((column, index) => index === 1 && filter === "deleted" ? { ...column, label: "Date deleted" } : column)}
                      loading={listLoading && !hasResults}
                      loadingRow={<TableRowSekeleton />}
                      onChangePage={setPage}
                      renderRow={(r, i) => (
                        <StoriesTableRow key={i} memory={r as IMemory} />
                      )}
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
