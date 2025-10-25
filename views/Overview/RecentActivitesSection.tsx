import QIcon from "@/public/icon/q.svg"
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import relativeTime from "dayjs/plugin/relativeTime";
import dayjs from "dayjs";
import { isEmpty } from "@/utility";

dayjs.extend(relativeTime);

const formatActivityDate = (date: string) => {
  const activityDate = dayjs(date);
  const timeStr = activityDate.format('h:mm A');
  const relativeStr = activityDate.fromNow();

  // Combine relative time with time
  return `${relativeStr} ${timeStr}`;
};

function RecentActivityItem({ activity }: { activity: any }) {
  return (
    <div className="w-full flex items-start space-x-2 pb-3">
      <div className="size-8 w-8 relative mt-1.5 inline">
        <div className="bg-sand-6 size-[19.2px] rounded-[3.21px] absolute top-0 origin-bottom-left translate-x-1 -translate-y-0.5 rotate-[6.76deg] z-20" />
        <div className="bg-sand-2 size-[19.2px] rounded-[3.21px] flex items-center justify-center absolute top-0 z-30">
          <QIcon width={7} height={10} />
        </div>
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <p className="font-georgia text-base text-gray-800 truncate">
          {activity?.description}
        </p>
        <span className="text-[#000933A6] text-sm font-inter">
          {formatActivityDate(activity.created_at)}
        </span>
      </div>
    </div>
  )
}

function RecentActivitySkeleton() {
  return (
    <div className="w-full flex items-start space-x-2 pb-3 animate-pulse">
      <div className="size-8 w-8 relative mt-1.5 inline">
        <div className="bg-sand-3 size-[19.2px] rounded-[3.21px] absolute top-0 origin-bottom-left translate-x-1 -translate-y-0.5 rotate-[6.76deg] z-20" />
        <div className="bg-sand-3 size-[19.2px] rounded-[3.21px] flex items-center justify-center absolute top-0 z-30" />
      </div>
      <div className="flex flex-col min-w-0 flex-1 space-y-2">
        <div className="w-full h-4 bg-sand-3 rounded" />
        <div className="w-24 h-3 bg-sand-3 rounded" />
      </div>
    </div>
  )
}

export default function RecentActivitiesSection() {
  const { data, isLoading } = useSWR(`${endpoint.activities}?page=1&limit=4`)

  return (
    <div className="flex-1 w-full lg:max-w-[335px] space-y-6">
      <div className="w-full items-center font-inter flex justify-between">
        <span className="font-semibold text-sm text-gray-800">
          Recent activities
        </span>
        <span className="text-blue-6 text-base underline">See all</span>
      </div>
      <div className="w-full flex flex-col gap-2">
        {
          isLoading ?
            Array.from({ length: 3 }, (_, i) => (
              <RecentActivitySkeleton key={`activity-skeleton-${i}`} />
            )) : !isEmpty(data?.data?.docs) ?
              data?.data?.docs.map((activity, i) => (
                <RecentActivityItem key={activity._id || i} activity={activity} />
              )) :
              <div className="flex items-center justify-center p-4">
                <p className="text-gray-500 text-sm">No recent activities</p>
              </div>
        }
      </div>
    </div>
  )
}