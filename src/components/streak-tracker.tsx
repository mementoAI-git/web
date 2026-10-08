import chatSettingsGradient from "@/assets/image/chat settings gradient.png";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/utility";
import type { PropsWithChildren } from "react";
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
import { useMemo, useState } from "react";

function Streak() {
  const { user } = useStore();
  const { data: statsData } = useSWR(endpoint.userStats);
  const stats = statsData?.data ?? {};

  const streak = useMemo(() => {
    const endIndex = dayjs(user?.last_seen).get("day");
    return {
      start_index: endIndex - Math.max(user?.streak ?? 0, 0),
      end_index: endIndex,
    };
  }, [user]);

  const streakCount = Number(stats.streak_count ?? user?.streak ?? 0);

  const getStreakMessage = (days: number): string => {
    if (days >= 21) {
      return `${days} days strong — This is dedication!`;
    }
    if (days >= 8) {
      return "You're on a roll! Your consistency is inspiring";
    }
    if (days === 7) {
      return "A full week of reflection — your story is taking shape!";
    }
    if (days >= 3) {
      return "Great rhythm! You're showing up and finding your pace.";
    }
    return "Every story starts with the first step. You've got this.";
  };

  return (
    <div
      className="relative isolate flex w-[311px] max-w-[calc(100vw-2rem)] flex-col gap-4 overflow-hidden rounded-3xl border border-stroke-neutral-weak bg-bg-neutral-solid p-4 shadow-btn sm:max-w-[calc(100vw-4rem)] [&>div]:relative"
    >
      <img
        src={chatSettingsGradient}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[466px] w-full object-fill opacity-50"
      />
      <div className="flex flex-col items-center justify-center gap-4 py-2">
        <div
          className="flex size-[115px] items-center justify-center rounded-full border border-stroke-neutral-weak bg-fill-brand-weak"
          aria-hidden
        >
          <span className="font-garamond text-[50px] font-bold leading-none text-text-brand-strong">
            {streakCount}
          </span>
        </div>
        <div className="flex flex-col gap-1 text-center">
          <span className="font-garamond text-xl text-text-neutral-strong">Day streak</span>
          <span className="max-w-[230px] font-inter text-xs text-text-neutral-weak">
            {getStreakMessage(streakCount)}
          </span>
        </div>
      </div>
      <div className="flex justify-center gap-2.5">
        {["s", "m", "t", "w", "t", "f", "s"].map((label, index) => {
          const today = dayjs();
          const startOfWeek = today.startOf("week");
          const dayDate = startOfWeek.add(index, "day");
          const isToday = dayDate.isSame(today, "day");

          return (
            <div key={`${label}-${index}`} className="flex min-w-6 flex-col items-center justify-center gap-2">
              <span
                className={cn(
                  "text-[10px] font-inter font-medium uppercase text-text-neutral-weaker",
                  isToday && "text-text-neutral-strong",
                )}
              >
                {isToday ? "Today" : label}
              </span>
              {streak.start_index < index && streak.end_index >= index ? (
                <div className="flex size-6 items-center justify-center rounded-full bg-fill-brand-strong text-primary-foreground">
                  <CheckIcon width={12} height={12} />
                </div>
              ) : (
                <span className="flex size-6 items-center justify-center text-center font-inter text-[9px] font-medium text-text-neutral-weaker">
                  {dayDate.format("D")}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-2 rounded-2xl bg-[var(--neutral-50)] px-1 dark:bg-fill-neutral-weak pb-1 pt-2">
        <span className="text-center font-geist text-xs text-text-neutral-weaker">Streak restore coming soon</span>
        <div className="flex w-full items-center justify-center rounded-2xl bg-bg-neutral-solid px-4 py-3 text-center font-inter text-sm text-text-neutral-weaker">
          <div className="flex flex-1 flex-col gap-2">
            <span>Days</span>
            <span className="text-text-neutral-strong">{streakCount}</span>
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <span>Reflections</span>
            <span className="text-text-neutral-strong">{stats.reflections_count || 0}</span>
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <span>Stories</span>
            <span className="text-text-neutral-strong">{stats.stories_count || 0}</span>
          </div>
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
              className="z-[9999] border-0 outline-none"
            >
              <Streak />
            </div>
          </FloatingFocusManager>,
          document.body,
        )}
    </div>
  );
}
