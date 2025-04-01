import BookIcon from "@/public/icon/dashboard/book.svg"
import BookmarkIcon from "@/public/icon/dashboard/bookmark.svg"
import { StatCard } from "../Dashboard"
import MemoriesHeader from "./MemoryHeader"
import MemoriesGrid from "./Grid"

export default function Memories() {
  return (
    <div className="w-full overflow-y-auto">
      <div className="px-14 py-8 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl font-inter leading-[30px] font-semibold">Stats</span>
          <div className="border-t border-[#EBEBEB] flex-1" />
        </div>
        <div className="flex items-center gap-3">
          <StatCard icon={<BookIcon width={20} height={16} />} subtitle="memories added" title="25" />
          <StatCard icon={<BookmarkIcon width={14} height={18} />} subtitle="bookmarks" title="5" />
        </div>
      </div>
      <div className="py-8 px-14 space-y-6">
        <MemoriesHeader />
        <MemoriesGrid />
      </div>
    </div>
  )
}