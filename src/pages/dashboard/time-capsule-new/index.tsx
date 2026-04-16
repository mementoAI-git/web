import endpoint from "@/api/endpoint";
import { useModal } from "@/hooks/use-modal";
import { useEffect, useState, useRef, useCallback } from "react";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { StatCard } from "../component/stat-card";
import { storageKeys } from "@/utility/constant";
import useIntersectionObserver from "@/hooks/use-intersection-observer";
import Spinner from "@/components/spinner";
import { fetcher } from "@/api/fetcher";
import CapsuleHeader from "./components/header";
import CapsuleGrid from "./components/grid";
import { TimerFillIcon } from "./components/icons/TimerFillIcon";
import { ZapIcon } from "./components/icons/ZapIcon";
import { UnpdfIcon } from "./components/icons/UnpdfIcon";
import CapsuleList from "./components/list";
import Button from "./components/Button";
import ScheduledBg from "./components/assets/scheduled.svg";
import DeliveredBg from "./components/assets/delivered.svg";
import DraftsBg from "./components/assets/drafts.svg";
import FrozenBg from "./components/assets/frozen.svg";
import { PauseIcon } from "./components/icons/PauseIcon";

export default function TimeCapsulePage() {
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

  const getFilterQuery = (currentFilter = filter) => {
    if (currentFilter === "all") return "";
    if (currentFilter === "scheduled") return "&status=scheduled";
    if (currentFilter === "delivered") return "&status=delivered";
    if (currentFilter === "draft") return "&status=draft";
    if (currentFilter === "paused") return "&status=pause";
    if (currentFilter === "failed") return "&status=failed";
    return "";
  };

  const getKey = useCallback(
    (pageIndex: number, previousPageData: { data?: { docs?: unknown[] } } | null) => {
      if (previousPageData && !previousPageData.data?.docs?.length) return null;
      return `${endpoint.capsule}?page=${pageIndex + 1}${getFilterQuery(filter)}`;
    },
    [filter],
  );

  const {
    data,
    size,
    setSize,
    isLoading,
  } = useSWRInfinite(getKey, fetcher, { revalidateOnFocus: false });

  const capsules = data ? data.flatMap((page) => page.data.docs) : [];
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");
  const hasMore = data?.[data.length - 1]?.data?.hasNextPage || false;

  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isIntersecting = useIntersectionObserver(loadMoreRef);

  useEffect(() => {
    if (isIntersecting && !isLoadingMore && hasMore) {
      setSize(size + 1);
    }
  }, [hasMore, isIntersecting, isLoadingMore, setSize, size]);

  const { data: stats } = useSWR(endpoint.capsuleStats);

  // Then access like this:
  const scheduledCount = stats?.data?.scheduled_count || 0;
  const deliveredCount = stats?.data?.delivered_count || 0;
  const pausedCount = stats?.data?.paused_count || 0;
  // const pausedCount = stats?.data?.paused_count || 0;
  // const failedCount = stats?.data?.failed_count || 0;
  const draftCount = stats?.data?.draft_count || 0;

  const values = [
    {
      icon: TimerFillIcon,
      iconProps: { width: 32 },
      count: scheduledCount,
      subtitle: "scheduled",
      bg: ScheduledBg,
      variant: "blue" as const,
    },
    {
      icon: ZapIcon,
      iconProps: { width: 32 },
      count: deliveredCount,
      subtitle: "delivered/unlocked",
      bg: DeliveredBg,
      variant: "pink" as const,
    },
    {
      icon: UnpdfIcon,
      iconProps: { width: 32 },
      count: draftCount,
      subtitle: "drafts",
      bg: DraftsBg,
      variant: "orange" as const,
    },
    {
      icon: PauseIcon,
      iconProps: { width: 32 },
      count: pausedCount,
      subtitle: "Frozen",
      bg: FrozenBg,
      variant: "green" as const,
    },
  ];

  return (
    <div className="page-viewport hide-scrollbar">
      <div className="size-full overflow-y-auto hide-scrollbar px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 sm:space-y-16 py-3 sm:py-4 lg:py-8">
          <div className="flex flex-col md:items-end md:flex-row md:justify-between gap-2">
            <div>
              <p className="font-garamond font-medium text-[32px] md:text-4xl lg:text-[40px] leading-tight sm:leading-snug md:leading-[48px]">
                <span>Timed Messages</span>
              </p>

              <p className="font-garamond font-normal text-base sm:text-[20px] leading-6 tracking-[0px] text-gray-700 pt-3 rounded-md">
                Send messages to your inner circle in the future
              </p>
            </div>

            <Button onClick={() => open("create-capsule")}>Create New</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {values.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <StatCard
                  key={stat.subtitle}
                  icon={<IconComponent {...stat.iconProps} />}
                  unit="messages"
                  title={stat.count}
                  subtitle={stat.subtitle}
                  bgImage={stat.bg}
                  variant={stat.variant}
                />
              );
            })}
          </div>
        </div>
        <div className="space-y-3 sm:space-y-4 lg:space-y-6 py-3 sm:py-4 lg:py-8">
          <CapsuleHeader
            totalCapsuleCount={
              scheduledCount + deliveredCount + draftCount + pausedCount || 0
            }
            mode={mode}
            onChangeMode={setMode}
            filter={filter}
            onChangeFilter={(newFilter) => {
              setFilter(newFilter);
            }}
          />
          {isLoading && capsules.length === 0 ? (
            <div className="flex justify-center py-20">
              <Spinner loading className="!size-20 !text-blue-600" />
            </div>
          ) : mode === "grid" ? (
            <CapsuleGrid
              data={capsules}
              filter={filter}
              loadMoreRef={loadMoreRef}
              isLoadingMore={isLoadingMore}
            />
          ) : (
            <CapsuleList
              data={capsules}
              filter={filter}
              loadMoreRef={loadMoreRef}
              isLoadingMore={isLoadingMore}
            />
          )}
        </div>
      </div>
    </div>
  );
}
