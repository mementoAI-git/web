"use client";

import CalendarIcon from "@/public/icon/calendar.svg";
import ImageThumbnail from "@/components/ImageThumbnail";
import { MemoryItemActions } from "./MemoriesDropdown";
import { IMemory, IPagination } from "@/utility/interface";
import dayjs from "dayjs";
import Link from "next/link";

function MemoriesGridItem({ memory }: { memory: IMemory }) {
  return (
    <Link href={`/memories/${memory?._id}`} className="flex h-[290px] w-[341.33px] flex-col gap-4 rounded-2xl bg-[#F9F9F9] p-6">
      <div className="flex h-[138px] w-full items-center justify-center rounded-lg bg-[#F3F3F3]">
        <div className="size-fit">
          <ImageThumbnail
            images={memory?.attachments}
            size={68.78}
            boxClassName="!border-[2px] !rounded-[11.96px]"
          />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1">
          <CalendarIcon />
          <span className="font-inter text-sm text-[#949494]">
            {dayjs(memory.created_at).format("MMM DD, YYYY")}
          </span>
        </div>
        <span className="truncate cursor-pointer font-inter font-semibold whitespace-nowrap text-[#050709]">
          {memory.title}
        </span>
        <div className="flex items-end justify-between text-[#949494]">
          <div className="flex flex-wrap items-center gap-2">
            {memory.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="rounded-full border border-[#D7DDF9] bg-[#E9ECFC] px-1.5 py-0.5 font-inter text-sm text-[#314FDF]"
              >
                {tag}
              </span>
            ))}
            {
              memory.tags.length > 3 &&
              <span className="mem-tags">+{memory.tags.length - 3}</span>
            }
          </div>

          <MemoryItemActions memory={memory} />
        </div>
      </div>
    </Link>
  );
}

export default function MemoriesGrid({ data }: { data: IPagination<IMemory> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
      {data?.docs.map((m, i) => <MemoriesGridItem key={i} memory={m} />)}
    </div>
  );
}
