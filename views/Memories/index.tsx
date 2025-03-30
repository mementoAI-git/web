import BookIcon from "@/public/icon/dashboard/book.svg"
import BookmarkIcon from "@/public/icon/dashboard/bookmark.svg"
import { StatCard } from "../Dashboard"
import MemoriesTableHeader from "./Header"
import MemoriesList from "./List"

export default function Memories() {
  return (
    <div>
      <div className="px-14 py-8 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl font-inter leading-[30px] font-semibold">Stats</span>
          <div className="border-t border-[#EBEBEB] flex-1" />
        </div>
        <div className="flex items-center gap-3">
          <StatCard icon={<BookIcon />} subtitle="memories added" title="25" />
          <StatCard icon={<BookmarkIcon />} subtitle="bookmarks" title="5" />
        </div>
      </div>
      <div className="py-8 px-14 space-y-6">
        <MemoriesTableHeader />
        <MemoriesList />
      </div>
    </div>
  )
}