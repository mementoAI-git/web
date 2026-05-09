import { Link } from "react-router-dom";
import { Fragment, useMemo } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar";
import endpoint from "@/api/endpoint";
import { isEmpty } from "@/utility";
import recentActivityIcon from "@/assets/icon/homepage/recent activities icon.svg";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { TypographyH2, TypographyMuted } from "@/components/ui/typography";

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

function RecentActivityItem({ activity }: { activity: Activity }) {
  const formattedDate = useMemo(
    () => formatActivityDate(activity.created_at),
    [activity.created_at],
  );

  return (
    <div className="flex w-full items-start gap-3 py-3">
      <div className="flex size-9 shrink-0 items-center justify-center">
        <img
          src={recentActivityIcon}
          alt=""
          className="size-9 object-contain"
        />
      </div>
      <div className="min-w-0 flex-1">
        <TypographyH2 className="line-clamp-2 font-inter text-base font-normal text-text-neutral-strong sm:text-base md:text-base lg:text-base sm:line-clamp-none sm:truncate">
          {activity.description}
        </TypographyH2>
        <TypographyMuted className="font-inter text-xs text-text-neutral-weak">
          {formattedDate}
        </TypographyMuted>
      </div>
    </div>
  );
}

function RecentActivitySkeleton({ isFirst }: { isFirst?: boolean }) {
  return (
    <Fragment>
      {!isFirst ? (
        <Separator className="bg-stroke-neutral-weaker" />
      ) : null}
      <div className="flex w-full items-start gap-3 py-3">
        <Skeleton className="size-9 shrink-0 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </Fragment>
  );
}

export default function RecentActivitiesSection() {
  const { data, isLoading } = useSWR<ActivitiesResponse>(
    `${endpoint.activities}?page=1&limit=4`,
  );
  const activities = data?.data?.docs ?? [];

  return (
    <div className="flex flex-1 flex-col gap-3 sm:gap-4">
      <header className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <TypographyH2 className="font-garamond font-normal text-xl leading-tight text-text-neutral-strong sm:text-2xl sm:leading-[38px] lg:text-[32px]">
          Recent{" "}
          <i className="text-text-neutral-weaker">Activities</i>
        </TypographyH2>
        <Button
          variant="link"
          asChild
          className="inline-flex min-h-[44px] shrink-0 items-center px-0 font-inter text-sm font-medium text-text-brand-strong underline hover:no-underline sm:min-h-0"
        >
          <Link to="/stories">See all</Link>
        </Button>
      </header>
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
                <Fragment key={activity._id ?? `activity-${index}`}>
                  {index > 0 ? (
                    <Separator className="bg-stroke-neutral-weaker" />
                  ) : null}
                  <RecentActivityItem activity={activity} />
                </Fragment>
              ))
            : (
              <div className="py-8 text-center">
                <TypographyMuted className="font-inter text-sm text-text-neutral-weak">
                  No recent activities
                </TypographyMuted>
              </div>
            )}
      </div>
    </div>
  );
}
