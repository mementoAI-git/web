import endpoint from "@/api/endpoint";
import { useModal } from "@/hooks/use-modal";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { StatCard } from "./components/stat-card";
import { DoubleHeartIcon, PlusIcon } from "@/components/icons";
import { storageKeys } from "@/utility/constant";
import { cn } from "@/utility";
import CapsuleHeader from "./components/header";
import CapsuleGrid from "./components/grid";
import { TimerFillIcon } from "./components/icons/TimerFillIcon";
import { ZapIcon } from "./components/icons/ZapIcon";
import { UnpdfIcon } from "./components/icons/UnpdfIcon";
import CapsuleList from "./components/list";

const columns = [
  { label: "topic" },
  { label: "Date created" },
  { label: "Tags", className: "min-w-32" },
  { label: "" },
];

export default function TimeCapsulePage() {
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

  const getFilterQuery = () => {
    if (filter === "all") return "";
    if (filter === "scheduled") return "&status=scheduled";
    if (filter === "delivered") return "&status=delivered";
    if (filter === "draft") return "&status=draft";
    if (filter === "paused") return "&status=pause";
    if (filter === "failed") return "&status=failed";
    return "";
  };

  const { data, isLoading } = useSWR(
    `${endpoint.capsule}?page=${page}${getFilterQuery()}`,
  );

  const { data: allCapsules } = useSWR(endpoint.capsule);

  const { data: beneficiaries } = useSWR(endpoint.beneficiaries);
  useEffect(() => {
    // console.log(data, allCapsules, beneficiaries);
    // console.log(beneficiaries);
    // console.log(allCapsules);
  }, [data, allCapsules, beneficiaries]);

  // const { data: beneficiariesFullData } = useSWR(endpoint.beneficiary, { id: beneficiaries });
  // useEffect(() => {
  //   // console.log(data, allCapsules, beneficiaries);
  //   // console.log(beneficiaries);
  //   console.log(beneficiariesFullData);
  // }, [data, allCapsules, beneficiariesFullData]);

  const scheduledCount =
    allCapsules?.data?.docs?.filter((capsule) => capsule.status === "scheduled")
      .length || 0;

  const deliveredCount =
    allCapsules?.data?.docs?.filter((capsule) => capsule.status === "delivered")
      .length || 0;

  const draftCount =
    allCapsules?.data?.docs?.filter((capsule) => capsule.status === "draft")
      .length || 0;

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

            <div>
              <button
                onClick={() => open("create-capsule")}
                className={cn("btn", "rounded-full! md:w-full w-fit")}
              >
                <PlusIcon width={15} />
                <span>Create New</span>
              </button>
            </div>
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
            totalCapsuleCount={allCapsules?.data?.docs?.length || 0}
            mode={mode}
            onChangeMode={setMode}
            filter={filter}
            onChangeFilter={setFilter}
          />
          {mode === "grid" ? (
            <CapsuleGrid data={data?.data} filter={filter} />
          ) : (
            <CapsuleList data={data?.data} filter={filter} />
          )}
        </div>
      </div>
    </div>
  );
}
