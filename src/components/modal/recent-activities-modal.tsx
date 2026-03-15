import { useMemo } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import endpoint from "@/api/endpoint";
import { isEmpty } from "@/utility";
import { useModal } from "@/hooks/use-modal";
import { QIcon, TimesIcon } from "@/components/icons";

dayjs.extend(relativeTime);

const formatActivityDate = (date: string) => {
  const activityDate = dayjs(date);
  const timeStr = activityDate.format("h:mm A");
  const relativeStr = activityDate.fromNow();
  return `${relativeStr} ${timeStr}`;
};

interface Activity {
  _id: string;
  description: string;
  created_at: string;
}

interface ActivitiesResponse {
  data?: {
    docs?: Activity[];
  };
}

function RecentActivityItem({ activity }: { activity: Activity }) {
  const formattedDate = useMemo(
    () => formatActivityDate(activity.created_at),
    [activity.created_at],
  );

  return (
    <div className="flex w-full items-start space-x-2 pb-3">
      <div className="relative mt-1.5 inline-flex size-8">
        <div className="absolute top-0 size-[19.2px] origin-bottom-left translate-x-1 -translate-y-0.5 rotate-[6.76deg] rounded-[3.21px] bg-sand-6" />
        <div className="absolute top-0 z-30 flex size-[19.2px] items-center justify-center rounded-[3.21px] bg-sand-2">
          <QIcon width={7} height={10} />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate font-georgia text-base text-gray-800">{activity.description}</p>
        <span className="font-inter text-sm text-[#000933A6]">{formattedDate}</span>
      </div>
    </div>
  );
}

function RecentActivitySkeleton() {
  return (
    <div className="flex w-full items-start space-x-2 pb-3 animate-pulse">
      <div className="relative mt-1.5 inline-flex size-8">
        <div className="absolute top-0 size-[19.2px] origin-bottom-left translate-x-1 -translate-y-0.5 rotate-[6.76deg] rounded-[3.21px] bg-sand-3" />
        <div className="absolute top-0 z-30 flex size-[19.2px] items-center justify-center rounded-[3.21px] bg-sand-3" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col space-y-2">
        <div className="h-4 w-full rounded bg-sand-3" />
        <div className="h-3 w-24 rounded bg-sand-3" />
      </div>
    </div>
  );
}

export default function RecentActivitiesModal() {
  const { close } = useModal();
  const { data, isLoading } = useSWR<ActivitiesResponse>(
    `${endpoint.activities}?page=1&limit=10`,
  );
  const activities = data?.data?.docs ?? [];

  return (
    <div className="bg-white rounded-[24px] w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <h2 className="font-garamond text-2xl font-medium text-gray-900">Recent activities</h2>
        <button
          onClick={() => close?.("recent-activities")}
          aria-label="Close"
          className="flex items-center justify-center size-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
        >
          <TimesIcon width={10} height={10} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <RecentActivitySkeleton key={`activity-skeleton-${index}`} />
            ))
          : !isEmpty(activities)
            ? activities.map((activity, index) => (
                <RecentActivityItem
                  key={activity._id ?? `activity-${index}`}
                  activity={activity}
                />
              ))
            : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="font-inter text-sm text-gray-500">No recent activities</p>
              </div>
            )}
      </div>
    </div>
  );
}
