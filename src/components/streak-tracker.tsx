import { useRequestRecovery } from "@/hooks/use-request-recovery";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/utility";
import type { PropsWithChildren, ReactNode } from "react";
import {
  FloatingFocusManager,
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import dayjs from "dayjs";
import { createPortal } from "react-dom";
import useSWR from "swr";
import endpoint from "@/api/endpoint";
import { CheckIcon } from "@/components/icons";
import { OverviewDesignIcon } from "@/components/overview-design-icon";
import { useMemo, useState } from "react";

const WEEK_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

/** Open-bottomed ring, shared with the mobile streak sheet. */
const STREAK_ARC_PATH =
  "M31.091 106.753C12.8665 97.4489 0.387861 78.497 0.387862 56.6305C0.387864 25.5686 25.5685 0.387936 56.6305 0.387937C87.6924 0.387938 112.873 25.5686 112.873 56.6305C112.873 78.497 100.394 97.4489 82.1699 106.753";

function getStreakMessage(days: number, firstName?: string) {
  const name = firstName ? `, ${firstName}` : "";
  if (days >= 21) return `You are a legend${name}. Keep it up!`;
  if (days >= 8) return `You are on a roll${name}. Keep it up!`;
  if (days === 7) return `A full week${name}. Your story is taking shape!`;
  if (days >= 3) return `Great rhythm${name}. Keep it up!`;
  if (days === 1) return `Great start${name}. Come back tomorrow!`;
  return `Every story starts somewhere${name}. You've got this!`;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Streak card B, the default. Card A stays available with `?streakCard=a` until one layout is chosen. */
function StreakCardB({
  streakCount,
  reflections,
  stories,
  days,
  retryControl,
}: {
  streakCount: number;
  reflections: number;
  stories: number;
  days: { label: string; date: string; isToday: boolean; active: boolean }[];
  retryControl: ReactNode;
}) {
  return (
    <div
      data-variant="b"
      className="flex w-[288px] max-w-[calc(100vw-2rem)] flex-col rounded-3xl border border-stroke-neutral-weak bg-popover p-4 shadow-drop-down sm:max-w-[calc(100vw-4rem)]"
    >
      <div className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="flex items-center justify-center [&_svg]:size-5"
        >
          <OverviewDesignIcon name="streak" />
        </span>
        <span className="font-geist text-sm font-semibold text-text-neutral-strong">Weekly streak</span>
      </div>
      <p className="mt-3 font-geist text-[28px] font-semibold leading-9 text-text-neutral-strong">
        {streakCount} {streakCount === 1 ? "day" : "days"}
      </p>
      <div className="mt-3 flex justify-between border-y border-stroke-neutral-weak py-3.5">
        {days.map(({ label, date, isToday, active }) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <span
              className={cn(
                "font-inter text-[11px] font-medium leading-3 text-text-neutral-weak",
                isToday && "font-semibold text-text-brand-strong",
              )}
            >
              {label}
            </span>
            <span
              role="img"
              aria-label={`${date}: ${active ? "active" : "no activity"}`}
              className={cn(
                "flex size-[30px] items-center justify-center rounded-full",
                active
                  ? "bg-fill-brand-strong"
                  : "bg-[var(--neutral-50)] dark:bg-fill-neutral-weak",
                !active && (isToday ? "border border-stroke-brand-strong" : "border border-stroke-neutral-weak"),
              )}
            >
              <span className="flex size-[18px] items-center justify-center rounded-full bg-popover text-text-brand-strong">
                {active ? <CheckIcon width={11} height={11} strokeWidth={1.75} /> : null}
              </span>
            </span>
          </div>
        ))}
      </div>
      {retryControl ? <div className="mt-3">{retryControl}</div> : null}
      <p className="mt-3 flex gap-5 font-inter text-[13px] text-text-neutral-weak">
        <span>
          <span className="font-semibold text-text-neutral-strong">{reflections}</span>{" "}
          {reflections === 1 ? "reflection" : "reflections"}
        </span>
        <span>
          <span className="font-semibold text-text-neutral-strong">{stories}</span>{" "}
          {stories === 1 ? "story" : "stories"}
        </span>
      </p>
    </div>
  );
}

function Streak() {
  const { user } = useStore();
  const { data: statsData, error, isValidating, mutate } = useSWR(endpoint.userStats, { refreshInterval: 60000 });
  const retry = useRequestRecovery("streak", error, mutate, "Couldn’t load your streak. Please retry.");
  const [now, setNow] = useState(() => dayjs());
  useEffect(() => { const timer = window.setInterval(() => setNow(dayjs()), 60000); return () => window.clearInterval(timer); }, []);
  const stats = statsData?.data ?? {};

  const streakCount = Number(stats.streak_count ?? user?.streak ?? 0);
  const lastActive = useMemo(() => user?.last_task_date ? dayjs(user.last_task_date).startOf("day") : null, [user?.last_task_date]);
  if (!statsData) return <div className="w-[288px] max-w-[calc(100vw-2rem)] rounded-3xl border border-stroke-neutral-weak bg-popover p-4 shadow-drop-down">
    {error ? <Button variant="outline" onClick={retry} disabled={isValidating}>Retry streak</Button> : <p role="status">Loading your streak…</p>}
  </div>;

  const startOfToday = now.startOf("day");
  const startOfWeek = startOfToday.subtract((startOfToday.day() + 6) % 7, "day");
  const isActiveDay = (day: dayjs.Dayjs) =>
    streakCount > 0 &&
    Boolean(lastActive?.isValid()) &&
    day.valueOf() <= lastActive!.valueOf() &&
    day.valueOf() >= lastActive!.subtract(streakCount - 1, "day").valueOf();

  if (new URLSearchParams(window.location.search).get("streakCard") !== "a") {
    return (
      <StreakCardB
        streakCount={streakCount}
        reflections={stats.reflections_count || 0}
        stories={stats.stories_count || 0}
        days={WEEKDAY_LABELS.map((label, index) => {
          const day = startOfWeek.add(index, "day");
          return {
            label,
            date: day.format("MMMM D"),
            isToday: day.isSame(startOfToday, "day"),
            active: isActiveDay(day),
          };
        })}
        retryControl={error ? <Button variant="outline" onClick={retry} disabled={isValidating}>Retry streak</Button> : null}
      />
    );
  }

  // Streak card A
  return (
    <div data-variant="a" className="flex w-[288px] max-w-[calc(100vw-2rem)] flex-col gap-4 rounded-3xl border border-stroke-neutral-weak bg-popover p-4 shadow-drop-down sm:max-w-[calc(100vw-4rem)]">
      <div className="flex flex-col items-center gap-2 pt-1">
        <div className="relative flex h-[88px] w-[93px] items-center justify-center" aria-hidden>
          <svg viewBox="0 0 114 108" fill="none" className="absolute inset-0 size-full text-stroke-brand-strong">
            <path d={STREAK_ARC_PATH} stroke="currentColor" strokeWidth={0.78} strokeLinecap="round" />
          </svg>
          <span className="font-garamond text-[51px] font-medium leading-none text-text-neutral-strong">
            {streakCount}
          </span>
        </div>
        <div className="flex flex-col gap-1 text-center">
          <span className="font-geist text-lg font-bold leading-6 text-text-neutral-strong">day streak</span>
          <span className="font-inter text-xs leading-4 text-text-neutral-weak">
            {getStreakMessage(streakCount, user?.nickname || user?.first_name)}
          </span>
        </div>
      </div>
      <div className="flex justify-between">
        {WEEK_LABELS.map((label, index) => {
          const day = startOfWeek.add(index, "day");
          const isToday = day.isSame(startOfToday, "day");
          const active = isActiveDay(day);

          return (
            <div key={`${label}-${index}`} className="flex min-w-[22px] flex-col items-center gap-2">
              <span
                className={cn(
                  "font-inter text-[10px] font-medium uppercase leading-3 text-text-neutral-weak",
                  isToday && "font-semibold text-text-brand-strong",
                )}
              >
                {isToday ? "Today" : label}
              </span>
              <span className="flex h-[22px] items-center justify-center">
                {isToday ? (
                  <span
                    aria-label={active ? `${day.format("MMMM D")}: active` : undefined}
                    role={active ? "img" : undefined}
                    className="flex items-center gap-0.5 font-inter text-[13px] font-semibold text-text-brand-strong [&_svg]:size-[13px]"
                  >
                    <OverviewDesignIcon name="streak" />
                    {day.format("D")}
                  </span>
                ) : active ? (
                  <span
                    role="img"
                    aria-label={`${day.format("MMMM D")}: active`}
                    className="flex size-[22px] items-center justify-center rounded-full bg-fill-streak-complete text-white"
                  >
                    <CheckIcon width={10} height={10} />
                  </span>
                ) : (
                  <span className="font-inter text-xs font-medium text-text-neutral-weak">
                    {day.format("D")}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      {error && <Button variant="outline" onClick={retry} disabled={isValidating}>Retry streak</Button>}
      <div className="flex flex-col gap-1.5 rounded-2xl bg-[var(--neutral-50)] px-1 pb-1 pt-2 dark:bg-fill-neutral-weak">
        <span className="text-center font-geist text-xs text-text-neutral-strong">Streak restore coming soon</span>
        <div className="flex w-full items-center justify-center rounded-[14px] bg-bg-neutral-solid px-2 py-3 text-center font-inter text-xs text-text-neutral-weak">
          {[
            ["Days", streakCount],
            ["Reflections", stats.reflections_count || 0],
            ["Stories", stats.stories_count || 0],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-1 flex-col gap-1.5">
              <span>{label}</span>
              <span className="text-[13px] font-bold text-text-neutral-strong">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StreakTracker({ children }: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "bottom-end",
    middleware: [
      offset(8),
      flip(),
      shift(() => ({
        padding: window.innerWidth >= 640 ? 32 : 16,
      })),
    ],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

  return (
    <div className="relative">
      <div ref={refs.setReference} {...getReferenceProps()}>
        {children}
      </div>

      {isOpen &&
        createPortal(
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="z-[9999] border-0 !bg-transparent outline-none"
            >
              <Streak />
            </div>
          </FloatingFocusManager>,
          document.body,
        )}
    </div>
  );
}
