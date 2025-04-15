"use client";

import CalendarIcon from "@/public/icon/calendar.svg"
import ImageThumbnail from "@/components/ImageThumbnail"
import { MemoryItemActions } from "./MemoriesDropdown";
import { IMemory, IPagination } from "@/utility/interface";
import dayjs from "dayjs";

function MemoriesGridItem({ memory }: { memory: IMemory }) {
  return (
    <div className="w-[341.33px] h-[290px] rounded-2xl p-6 flex flex-col gap-4 bg-[#F9F9F9]">
      <div className="w-full flex justify-center items-center rounded-lg bg-[#F3F3F3] h-[138px]">
        <div className="size-fit ">
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
          <span className="font-inter text-sm text-[#949494]">{dayjs(memory.created_at).format("MMM DD, YYYY")}</span>
        </div>
        <span className="font-semibold text-[#050709] font-inter whitespace-nowrap truncate">{memory.title}</span>
        <div className="flex items-center justify-between text-[#949494]">
          <div className="space-x-2">
            {
              memory.tags.map((tag, i) => (
                <span
                  key={i}
                  className="py-0.5 px-1.5 border rounded-full bg-[#E9ECFC] border-[#D7DDF9] text-sm text-[#314FDF] font-inter"
                >
                  {tag}
                </span>
              ))
            }
            {/* <span className="py-0.5 px-1.5 border rounded-full bg-[#E9ECFC] border-[#D7DDF9] text-sm text-[#314FDF] font-inter">travel</span>
            <span className="py-0.5 px-1.5 border rounded-full bg-[#E9ECFC] border-[#D7DDF9] text-sm text-[#314FDF] font-inter">family</span> */}
          </div>

          <MemoryItemActions />
        </div>
      </div>
    </div>
  )
}

export default function MemoriesGrid({ data }: { data: IPagination<IMemory> }) {
  return (
    <div>
      {data.docs.map((m, i) => <MemoriesGridItem key={i} memory={m} />)}
    </div>
  )
}
