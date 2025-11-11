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
import blueFire from "@/assets/image/blue-fire.png";
import greenDiamondFull from "@/assets/image/green-diamond-full.png";
import orangeDiamond from "@/assets/image/orange-diamond.png";
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

  const name = user?.first_name || user?.last_name || "";

  return (
    <div
      className="flex w-[311px] flex-col gap-5 rounded-2xl border border-[#0011661A] bg-sand-1 p-4"
      style={{
        boxShadow: "0px 20px 24px -4px #00000014, 0px 8px 8px -4px #0000000A",
      }}
    >
      <div className="flex flex-col items-center justify-center gap-11 py-6">
        <div className="relative flex size-[115.2px] items-center justify-center rounded-full border border-sand-4">
          <img src={blueFire} alt="Streak blue fire" className="size-16 object-contain" />
          <div className="absolute top-[90%] bg-sand-1 px-6 font-canela text-[50px] font-bold leading-[50px]">
            {user?.streak ? (Number(user.streak) / 7).toFixed(0) : 0}
          </div>
        </div>
        <div className="flex flex-col gap-1 text-center">
          <span className="font-canela text-xl text-gray-800">Week streak</span>
          <span className="font-inter text-xs text-gray-500">
            You are on a roll{name ? `, ${name}.` : "."} Keep it up!
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
            <div key={label} className="flex min-w-6 flex-col items-center justify-center gap-2">
              <span
                className={cn(
                  "text-[10px] font-inter font-medium uppercase text-gray-300",
                  isToday && "text-gray-800",
                )}
              >
                {isToday ? "Today" : label}
              </span>
              {streak.start_index < index && streak.end_index >= index ? (
                <div className="flex size-6 items-center justify-center rounded-full bg-blue-6 text-white">
                  <CheckIcon width={12} height={12} />
                </div>
              ) : (
                <span className="flex size-6 items-center justify-center text-center font-inter text-[9px] font-medium text-gray-400">
                  {dayDate.format("D")}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-2 rounded-2xl bg-sand-3 px-1 pb-1 pt-2">
        <span className="text-center font-geist text-xs text-sand-10">
          Streak restore coming soon
        </span>
        <div className="flex w-full items-center justify-center rounded-2xl bg-sand-1 px-6 py-4 text-center font-inter text-sm text-gray-400">
          <div className="flex flex-1 flex-col gap-2.5">
            <span>Days</span>
            <span className="text-gray-600">{stats.streak_count || user?.streak || 0}</span>
          </div>
          <div className="flex flex-1 flex-col gap-2.5">
            <span>Reflections</span>
            <span className="text-gray-600">{stats.reflections_count || 0}</span>
          </div>
          <div className="flex flex-1 flex-col gap-2.5">
            <span>Stories</span>
            <span className="text-gray-600">{stats.stories_count || 0}</span>
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
    middleware: [offset(8), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

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
              <div className="relative">
                <img
                  src={greenDiamondFull}
                  alt="Green diamond"
                  className="pointer-events-none absolute -right-4 bottom-4 w-24 opacity-10"
                />
                <img
                  src={orangeDiamond}
                  alt="Orange diamond"
                  className="pointer-events-none absolute -left-4 top-4 w-16 opacity-10"
                />
                <Streak />
              </div>
            </div>
          </FloatingFocusManager>,
          document.body,
        )}
    </div>
  );
}

