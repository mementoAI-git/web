import { Link } from "react-router-dom";
import { useMemo } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar";
import endpoint from "@/api/endpoint";
import { isEmpty } from "@/utility";
import recentActivityIcon from "@/assets/icon/homepage/recent activities icon.svg";

dayjs.extend(calendar);

const formatActivityDate = (date: string) => {
  const d = dayjs(date);
  const now = dayjs();
  return d.isSame(now, "day")
    ? "Today"
    : d.isSame(now.subtract(1, "day"), "day")
      ? "Yesterday"
      : d.isAfter(now.subtract(7, "day"))
        ? `${now.diff(d, "day")} days ago`
        : d.format("MMM D");
};

interface Activity {
  _id: string;
  description: string;
  created_at: string;
  type?: string;
}

interface ActivitiesResponse {
  data?: {
    docs?: Activity[];
  };
}

function RecentActivityItem({
  activity,
  isFirst,
}: {
  activity: Activity;
  isFirst?: boolean;
}) {
  const formattedDate = useMemo(
    () => formatActivityDate(activity.created_at),
    [activity.created_at],
  );

  return (
    <div
      className={`flex w-full items-start gap-3 py-3 ${!isFirst ? "border-t border-v3-stroke-weak" : ""}`}
    >
      <div className="flex size-9 shrink-0 items-center justify-center">
        <img
          src={recentActivityIcon}
          alt=""
          className="size-9 object-contain"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-inter text-sm font-medium text-v3-text-strong">
          {activity.description}
        </p>
        <p className="font-inter text-xs text-v3-text-weak">
          {formattedDate}
        </p>
      </div>
    </div>
  );
}

function RecentActivitySkeleton({ isFirst }: { isFirst?: boolean }) {
  return (
    <div
      className={`flex w-full items-start gap-3 py-3 animate-pulse ${!isFirst ? "border-t border-v3-stroke-weak" : ""}`}
    >
      <div className="size-9 shrink-0 rounded bg-v3-fill-weak" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-full rounded bg-v3-fill-weak" />
        <div className="h-3 w-24 rounded bg-v3-fill-weak" />
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
    <div className="flex flex-1 flex-col gap-4 p-5">
      <div className="flex w-full items-center justify-between">
        <h3 className="font-inter text-base font-semibold text-v3-text-strong">
          Recent <i className="font-garamond font-normal italic">activities</i>
        </h3>
        <Link
          to="/stories"
          className="font-inter text-sm font-medium text-orange underline hover:no-underline"
        >
          See all
        </Link>
      </div>
      <div className="flex flex-col">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <RecentActivitySkeleton
                key={`skeleton-${i}`}
                isFirst={i === 0}
              />
            ))
          : !isEmpty(activities)
            ? activities.map((activity, index) => (
                <RecentActivityItem
                  key={activity._id ?? `activity-${index}`}
                  activity={activity}
                  isFirst={index === 0}
                />
              ))
            : (
              <div className="py-8 text-center">
                <p className="font-inter text-sm text-v3-text-weak">
                  No recent activities
                </p>
              </div>
            )}
      </div>
    </div>
  );
}
