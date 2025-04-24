"use client";

import CalendarIcon from "@/public/icon/calendar.svg";
import ImageThumbnail from "@/components/ImageThumbnail";
import { MemoryItemActions } from "./MemoriesDropdown";
import { IMemory, IPagination } from "@/utility/interface";
import dayjs from "dayjs";

function MemoriesGridItem({ memory }: { memory: IMemory }) {
  return (
    <div className="flex h-[290px] w-[341.33px] flex-col gap-4 rounded-2xl bg-[#F9F9F9] p-6">
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
        <span className="truncate font-inter font-semibold whitespace-nowrap text-[#050709]">
          {memory.title}
        </span>
        <div className="flex items-center justify-between text-[#949494]">
          <div className="space-x-2">
            {memory.tags.map((tag, i) => (
              <span
                key={i}
                className="rounded-full border border-[#D7DDF9] bg-[#E9ECFC] px-1.5 py-0.5 font-inter text-sm text-[#314FDF]"
              >
                {tag}
              </span>
            ))}
            {/* <span className="py-0.5 px-1.5 border rounded-full bg-[#E9ECFC] border-[#D7DDF9] text-sm text-[#314FDF] font-inter">travel</span>
            <span className="py-0.5 px-1.5 border rounded-full bg-[#E9ECFC] border-[#D7DDF9] text-sm text-[#314FDF] font-inter">family</span> */}
          </div>

          <MemoryItemActions memory={memory} />
        </div>
      </div>
    </div>
  );
}

export default function MemoriesGrid({ data }: { data: IPagination<IMemory> }) {
  return (
    <div>
      {data?.docs.map((m, i) => <MemoriesGridItem key={i} memory={m} />)}
    </div>
  );
}
