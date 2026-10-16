import { useMemo } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar";
import endpoint from "@/api/endpoint";
import { isEmpty } from "@/utility";
import { useModal } from "@/hooks/use-modal";
import {
  ChatIcon,
  FolderIcon,
  PlanePaperIcon,
  TimesIcon,
} from "@/components/icons";

dayjs.extend(calendar);

const formatActivityTimestamp = (date: string) => {
  const d = dayjs(date);
  const now = dayjs();
  const dateStr =
    d.isSame(now, "day")
      ? "Today"
      : d.isSame(now.subtract(1, "day"), "day")
        ? "Yesterday"
        : d.isAfter(now.subtract(7, "day"))
          ? `${now.diff(d, "day")} days ago`
          : d.format("MMM D");
  const timeStr = d.format("h:mm A");
  return `${dateStr} • ${timeStr}`;
};

type ActivityType = "chat" | "story" | "memo" | "prompt";

interface Activity {
  _id: string;
  description: string;
  created_at: string;
  type?: ActivityType;
}

interface ActivitiesResponse {
  data?: {
    docs?: Activity[];
  };
}

const ACTIVITY_ICON_STYLES: Record<
  ActivityType,
  { bg: string; icon: string; Icon: typeof ChatIcon }
> = {
  chat: {
    bg: "bg-blue-100",
    icon: "text-blue-600",
    Icon: ChatIcon,
  },
  prompt: {
    bg: "bg-green-100",
    icon: "text-green-600",
    Icon: ChatIcon,
  },
  story: {
    bg: "bg-amber-100",
    icon: "text-amber-600",
    Icon: FolderIcon,
  },
  memo: {
    bg: "bg-pink-100",
    icon: "text-pink-600",
    Icon: PlanePaperIcon,
  },
};

function RecentActivityItem({
  activity,
  isFirst,
}: {
  activity: Activity;
  isFirst?: boolean;
}) {
  const formattedTimestamp = useMemo(
    () => formatActivityTimestamp(activity.created_at),
    [activity.created_at],
  );
  const type = (activity.type ?? "chat") as ActivityType;
  const { bg, icon, Icon } = ACTIVITY_ICON_STYLES[type] ?? ACTIVITY_ICON_STYLES.chat;

  return (
    <div
      className={`flex w-full items-start gap-3 py-3 ${!isFirst ? "border-t border-v3-stroke-weak" : ""}`}
    >
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${bg}`}
      >
        <Icon className={`size-4 ${icon}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-inter text-sm font-medium text-v3-text-strong">
          {activity.description}
        </p>
        <p className="font-inter text-xs text-v3-text-weak">
          {formattedTimestamp}
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
      <div className="size-9 shrink-0 rounded-lg bg-v3-fill-weak" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-full rounded bg-v3-fill-weak" />
        <div className="h-3 w-24 rounded bg-v3-fill-weak" />
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
    <div className="bg-white rounded-[var(--radius-modal)] w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-6 py-5 border-b border-v3-stroke-weak">
        <h2 className="font-inter text-xl font-semibold text-v3-text-strong">
          Recent <i className="font-garamond font-normal italic">activities</i>
        </h2>
        <button
          onClick={() => close?.("recent-activities")}
          aria-label="Close"
          className="flex items-center justify-center size-8 rounded-full bg-v3-fill-weak hover:opacity-80 transition-colors shrink-0"
        >
          <TimesIcon width={10} height={10} className="text-v3-icon-neutral" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <RecentActivitySkeleton
                key={`skeleton-${index}`}
                isFirst={index === 0}
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
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="font-inter text-sm text-v3-text-weak">
                  No recent activities
                </p>
              </div>
            )}
      </div>
    </div>
  );
}
