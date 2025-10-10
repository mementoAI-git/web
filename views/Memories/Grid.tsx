"use client";

import CalendarIcon from "@/public/icon/calendar.svg";
import ImageThumbnail from "@/components/ImageThumbnail";
import { MemoryItemActions } from "./MemoriesDropdown";
import { IMemory, IPagination } from "@/utility/interface";
import dayjs from "dayjs";
import Link from "next/link";
import { useState } from "react";

function MemoriesGridItem({ memory }: { memory: IMemory }) {

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex min-h-[250px] w-full flex-col gap-3 sm:gap-4 rounded-xl sm:rounded-2xl bg-sand-1 p-4 sm:p-6 border-gray-200 border hover:border-sand-8">
      <div
        className="relative flex h-[120px] sm:h-[138px] overflow-hidden w-full items-center justify-center rounded-lg bg-[#F3F3F3]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {
          (memory?.attachments.length === 1 &&
            memory?.attachments[0].type.includes("image")) ?
            <img src={memory?.attachments[0].url} className="object-cover w-full h-full" /> :
            <Link href={`/memories/${memory?._id}`} className="size-fit">
              <ImageThumbnail
                images={memory?.attachments}
                size={68.78}
                boxClassName="!border-[2px] !rounded-[11.96px]"
              />
            </Link>
        }

        {isHovered && (
          <div className="absolute top-4 right-4 bg-white rounded-md shadow-md">
            <MemoryItemActions memory={memory} />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:gap-3 flex-1">
        <div className="flex items-center gap-1">
          <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-inter text-xs sm:text-sm text-[#949494]">
            {dayjs(memory.created_at).format("MMM DD, YYYY")}
          </span>
        </div>
        <Link href={`/memories/${memory?._id}`} className="truncate cursor-pointer font-inter font-semibold text-sm sm:text-base text-[#050709] line-clamp-2">
          {memory.title}
        </Link>
        <div className="flex items-end justify-between text-[#949494] mt-auto">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            {memory.tags.slice(0, 3).map((tag, i) => {
              const tagStyles = "rounded-full px-1 sm:px-1.5 py-0.5 font-inter text-xs sm:text-sm";

              const colorClasses = [
                "border border-[#D7DDF9] bg-[#EAECFC] text-[#4863E3]",
                "border border-[#FEE4E2] bg-[#FDF3F3] text-[#F98079]",
                "border border-[#12B76A] text-[#12B76A] bg-transparent font-medium",
              ];

              const colorClass = colorClasses[i % colorClasses.length];

              return (
                <span key={i} className={`${tagStyles} ${colorClass}`}>
                  {tag}
                </span>
              );
            })}
            {
              memory.tags.length > 3 &&
              <span className="mem-tags text-xs sm:text-sm">+{memory.tags.length - 3}</span>
            }
          </div>

          {/* <MemoryItemActions memory={memory} /> */}
        </div>
      </div>
    </div>
  );
}

export default function MemoriesGrid({ data }: { data: IPagination<IMemory> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-fr">
      {data?.docs.map((m, i) => <MemoriesGridItem key={i} memory={m} />)}
    </div>
  );
}