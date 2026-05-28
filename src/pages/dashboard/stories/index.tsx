import endpoint from "@/api/endpoint";
import { useModal } from "@/hooks/use-modal";
import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { StatCard } from "../component/stat-card";
import { DoubleHeartIcon } from "@/components/icons";

import totalMemoriesBg from "@/assets/icon/total-memories.svg";
import mediaFilesBg from "@/assets/icon/media-files.svg";
import favouritesCardBg from "@/assets/icon/favourites-card.svg";
import storageCardBg from "@/assets/icon/storage-card.svg";

import Table from "@/components/table";
import { storageKeys } from "@/utility/constant";
import StoriesHeader from "./components/header";
import StoriesGrid from "./components/grid";
import { TableRowSekeleton } from "./components/skeleton";
import { StoriesMobileList } from "./components/list-mobile";
import StoriesTableRow from "./components/row";
import type { IMemory } from "@/utility/interface";
import {
  TypographyH1,
  TypographyH2,
  TypographyLead,
  TypographyMuted,
} from "@/components/ui/typography";
import { useDashboardHeaderActions } from "@/contexts/dashboard-header-actions";
import { StoriesActionButtons } from "./components/stories-action-buttons";

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
  const [canPromoteActionsToNav, setCanPromoteActionsToNav] = useState(
    () => typeof window !== "undefined" ? window.innerWidth >= 1280 : true,
  );
  const { open } = useModal();
  const { setShowStoriesActions } = useDashboardHeaderActions();
  const actionButtonsRef = useRef<HTMLDivElement | null>(null);

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

  const { data, isLoading } = useSWR(`${endpoint.stories}?page=${page}${filterQuery}`, {
    refreshInterval: hasQuickPending ? 4000 : 0,
  });
  const { data: stats } = useSWR(endpoint.memoriesStats);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
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
    if (!canPromoteActionsToNav) {
      setShowStoriesActions(false);
      return;
    }

    const node = actionButtonsRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStoriesActions(!entry.isIntersecting);
      },
      {
        threshold: 0.2,
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      setShowStoriesActions(false);
    };
  }, [canPromoteActionsToNav, setShowStoriesActions]);

  useEffect(() => () => setShowStoriesActions(false), [setShowStoriesActions]);

  return (
    <div className="page-viewport hide-scrollbar mx-0 w-full max-w-none">
      <div className="size-full w-full overflow-y-auto hide-scrollbar px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-none space-y-6 py-3 sm:space-y-16 sm:py-4 lg:py-8">
          <div className="flex flex-col md:items-end md:flex-row md:justify-between gap-2">
            <div>
              <TypographyH1 className="font-garamond font-normal text-[32px] leading-tight text-v3-text-strong sm:leading-snug md:text-4xl md:leading-[48px] lg:text-[40px]">
                My stories
              </TypographyH1>
              <TypographyLead className="pt-2 font-inter font-normal text-v3-text-weak">
                Add stories, images, audios - whatever, to your Memento
              </TypographyLead>
            </div>

            <div ref={actionButtonsRef}>
              <StoriesActionButtons
                onViewInsights={() => open("memory-insights")}
                onCreateMemory={() => open("create-memory")}
                onQuickCapture={() => open("quick-capture")}
              />
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
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
        <div className="w-full max-w-none space-y-6 py-3 sm:space-y-8 sm:py-4 lg:space-y-10 lg:py-8">
          <StoriesHeader
            mode={mode}
            onChangeMode={setMode}
            filter={filter}
            onChangeFilter={setFilter}
            count={stats?.data?.stories_count || 0}
            bookmarkedCount={stats?.data?.stories_bookmarked_count || 0}
            deletedCount={stats?.data?.stories_deleted_count || 0}
          />
          {mode === "grid" ? (
            <StoriesGrid data={data?.data} />
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
  );
}
