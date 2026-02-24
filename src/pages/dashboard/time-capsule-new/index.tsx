import endpoint from "@/api/endpoint";
import { useModal } from "@/hooks/use-modal";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { StatCard } from "./components/stat-card";
import { storageKeys } from "@/utility/constant";
import CapsuleHeader from "./components/header";
import CapsuleGrid from "./components/grid";
import { TimerFillIcon } from "./components/icons/TimerFillIcon";
import { ZapIcon } from "./components/icons/ZapIcon";
import { UnpdfIcon } from "./components/icons/UnpdfIcon";
import CapsuleList from "./components/list";
import Button from "./components/Button";

export default function TimeCapsulePage() {
  const [page] = useState(1);
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

  // const getFilterQuery = () => {
  //   if (filter === "all") return "";
  //   if (filter === "scheduled") return "&status=scheduled";
  //   if (filter === "delivered") return "&status=delivered";
  //   if (filter === "draft") return "&status=draft";
  //   if (filter === "paused") return "&status=pause";
  //   if (filter === "failed") return "&status=failed";
  //   return "";
  // };

  const getFilterQuery = (currentFilter = filter) => {
    if (currentFilter === "all") return "";
    if (currentFilter === "scheduled") return "&status=scheduled";
    if (currentFilter === "delivered") return "&status=delivered";
    if (currentFilter === "draft") return "&status=draft";
    if (currentFilter === "paused") return "&status=pause";
    if (currentFilter === "failed") return "&status=failed";
    return "";
  };

  const { data: capsule } = useSWR(
    `${endpoint.capsule}?page=${page}${getFilterQuery()}`,
  );

  const { data: stats } = useSWR(endpoint.capsuleStats);

  // Then access like this:
  const scheduledCount = stats?.data?.scheduled_count || 0;
  const deliveredCount = stats?.data?.delivered_count || 0;
  // const pausedCount = stats?.data?.paused_count || 0;
  // const failedCount = stats?.data?.failed_count || 0;
  const draftCount = stats?.data?.draft_count || 0;

  const values = [
    {
      icon: TimerFillIcon,
      iconProps: { width: 58 },
      message: `${scheduledCount} messages`,
      title: "scheduled",
    },
    {
      icon: ZapIcon,
      iconProps: { width: 58 },
      message: `${deliveredCount} messages`,
      title: "delivered/unlocked",
    },
    {
      icon: UnpdfIcon,
      iconProps: { width: 58 },
      message: `${draftCount} messages`,
      title: "drafts",
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {values.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <StatCard
                  key={index}
                  icon={<IconComponent {...stat.iconProps} />}
                  message={stat.message}
                  title={stat.title}
                />
              );
            })}
          </div>
        </div>
        <div className="space-y-3 sm:space-y-4 lg:space-y-6 py-3 sm:py-4 lg:py-8">
          <CapsuleHeader
            totalCapsuleCount={
              scheduledCount + deliveredCount + draftCount || 0
            }
            mode={mode}
            onChangeMode={setMode}
            filter={filter}
            // onChangeFilter={(filter) => {
            //   setFilter(filter);
            //   console.log(
            //     `${endpoint.capsule}?page=${page}${getFilterQuery()}`,
            //   );
            //   console.log(filter);
            // }}
            onChangeFilter={(newFilter) => {
              setFilter(newFilter);
            }}
          />
          {mode === "grid" ? (
            <CapsuleGrid data={capsule?.data} filter={filter} />
          ) : (
            <CapsuleList data={capsule?.data} filter={filter} />
          )}
        </div>
      </div>
    </div>
  );
}
