import { useMemo } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import endpoint from "@/api/endpoint";
import { isEmpty } from "@/utility";
import { QIcon } from "@/components/icons";

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

export default function RecentActivitiesSection() {
  const { data, isLoading } = useSWR<ActivitiesResponse>(
    `${endpoint.activities}?page=1&limit=4`,
  );
  const activities = data?.data?.docs ?? [];

  return (
    <div className="flex w-full flex-1 flex-col gap-6 lg:max-w-[335px]">
      <div className="flex w-full items-center justify-between font-inter">
        <span className="text-sm font-semibold text-gray-800">Recent activities</span>
      </div>
      <div className="flex w-full flex-col gap-2">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
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
                <div className="flex items-center justify-center p-4">
                  <p className="text-sm text-gray-500">No recent activities</p>
                </div>
              )}
      </div>
    </div>
  );
}

