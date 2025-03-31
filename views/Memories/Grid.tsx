"use client";

import VeriticalElipseIcon from "@/public/icon/vertical-ellipse.svg"
import CalendarIcon from "@/public/icon/calendar.svg"
import EditIcon from "@/public/icon/edit.svg"
import TrashIcon from "@/public/icon/trash.svg"
import LunchIcon from "@/public/icon/lauch.svg"
import BookmarkIcon from "@/public/icon/dashboard/bookmark.svg"
import ImageThumbnail from "@/components/ImageThumbnail"
import DropdowmMenu from "@/components/Dropdown/DropdownMenu";

export default function MemoriesGrid() {
  return (
    <div className="w-[341.33px] h-[290px] rounded-2xl p-6 flex flex-col gap-4 bg-[#F9F9F9]">
      <div className="w-full flex justify-center items-center rounded-lg bg-[#F3F3F3] h-[138px]">
        <div className="w-[96px] h-[82.04px]">
          <ImageThumbnail size={68.78} boxClassName="!border-[2px] rounded-[11.96px]" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1">
          <CalendarIcon />
          <span className="font-inter text-sm text-[#949494]">Jan 18, 2025</span>
        </div>
        <span className="font-semibold text-[#050709] font-inter">My travel expeditions in 2024</span>
        <div className="flex items-center justify-between text-[#949494]">
          <div className="space-x-2">
            <span className="py-0.5 px-1.5 border rounded-full bg-[#E9ECFC] border-[#D7DDF9] text-sm text-[#314FDF] font-inter">travel</span>
            <span className="py-0.5 px-1.5 border rounded-full bg-[#E9ECFC] border-[#D7DDF9] text-sm text-[#314FDF] font-inter">family</span>
          </div>
          <div className="relative">
            <VeriticalElipseIcon />
            <DropdowmMenu
              items={[
                { label: "Edit story", value: "edit-story", startIcon: <EditIcon width={16} size={16} /> },
                { label: "Share story", value: "share-story", startIcon: <LunchIcon width={16} size={16} /> },
                { label: "Book mark", value: "bookmark", startIcon: <BookmarkIcon className="w-[16px] h-[16px]" width={16} height={16} /> }
              ]}
              footerItem={
                <li className="flex items-center py-2 px-1 gap-2.5 text-[#F97066]">
                  <TrashIcon width={16} size={16} />
                  <span className="font-inter text-sm">Delete</span>
                </li>
              }
              onSelect={console.log}
              className="!right-0 !left-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// box - shadow: 2px 4px 12px 0px #00000040;
