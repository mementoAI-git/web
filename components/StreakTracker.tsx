import { useStore } from "@/hooks/use-store";
import React, { PropsWithChildren, useMemo, useState } from "react";
import CheckmarkIcon from "@/public/icon/check.svg"
import blueFire from "@/public/image/blue-fire.png"
import Image from "next/image";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingFocusManager
} from '@floating-ui/react';
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import { cn } from "@/utility";

function Streak() {
  const { user } = useStore()
  const name = user?.first_name || user?.last_name

  const streak = useMemo(() => {
    const end_index = dayjs(user?.last_seen).get("day")
    return {
      start_index: end_index - Math.max(user?.streak, 0),
      end_index
    }
  }, [user])

  return (
    <div
      className="bg-sand-1 border border-[#0011661A] rounded-2xl flex flex-col gap-5 p-4 w-[311px]"
      style={{
        boxShadow: "0px 20px 24px -4px #00000014, 0px 8px 8px -4px #0000000A"
      }}
    >
      <div className="py-6 flex flex-col gap-11 justify-center items-center">
        <div className="size-[115.2px] relative flex justify-center items-center rounded-full border border-sand-4">
          <Image src={blueFire} alt="Streak blue fire" className="size-16 object-contain" />
          <div className="absolute font-canela font-bold text-[50px] leading-[50px] px-6 bg-sand-1 top-[90%]">
            {user?.streak ? (Number(user?.streak) / 7).toFixed(0) : 0}
          </div>
        </div>
        <div className="text-center flex flex-col gap-1">
          <span className="text-xl font-canela text-gray-800">Week streak</span>
          <span className="text-xs font-inter text-gray-500">
            You are on a roll{name ? `, ${name}.` : "."} Keep it up!
          </span>
        </div>
      </div>
      <div className="flex gap-2.5 justify-center">
        {
          ["s", "m", "t", "w", "t", "f", "s"].map((s, i) => {
            // Calculate the date for each day of the week
            const today = dayjs();
            const startOfWeek = today.startOf('week');
            const dayDate = startOfWeek.add(i, 'day');
            const isToday = dayDate.isSame(today, 'day');

            return (
              <div key={s} className="flex min-w-6 flex-col gap-2 justify-center items-center">
                <span className={cn("text-[10px] font-medium font-inter text-gray-300 uppercase", { "text-gray-800": isToday })}>
                  {isToday ? "Today" : s}
                </span>
                {
                  streak.start_index < i && streak.end_index >= i ?
                    <div className="text-white flex justify-center items-center bg-blue-6 size-6 rounded-full">
                      <CheckmarkIcon className="size-3" />
                    </div> :
                    <span className="text-[9px] size-6 flex justify-center items-center font-inter text-center font-medium text-gray-400">{dayDate.format('D')}</span>
                }
              </div>
            )
          })
        }
      </div>
      <div className="bg-sand-3 px-1 pb-1 pt-2 flex flex-col gap-2 justify-center rounded-2xl">
        <span className="font-geist text-xs text-sand-10 text-center">Streak restore coming soon</span>
        <div className="bg-sand-1 font-inter text-gray-400 text-sm rounded-2xl text-center py-4 px-6 flex justify-center items-center w-full">
          <div className="flex-1 flex-col flex gap-2.5">
            <span>Days</span>
            <span className="text-gray-600">{user?.streak}</span>
          </div>
          <div className="flex-1 flex-col flex gap-2.5">
            <span>Prompts</span>
            <span className="text-gray-600">26</span>
          </div>
          <div className="flex-1 flex-col flex gap-2.5">
            <span>Memories</span>
            <span className="text-gray-600">14</span>
          </div>
        </div>
      </div>
    </div>
  )
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
      <div
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        {children}
      </div>

      {isOpen && createPortal(
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
        document.body
      )}
    </div>
  );
}