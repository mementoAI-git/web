import BookIcon from "@/public/icon/dashboard/book.svg"
import BookmarkIcon from "@/public/icon/dashboard/bookmark.svg"
import { StatCard } from "../Dashboard"
import MemoriesHeader from "./MemoryHeader"
import MemoriesGrid from "./Grid"
import useSWR from "swr"
import endpoint from "@/api/endpoint"
import { useState } from "react"
import MemoriesTable from "./Table"

export default function Memories() {
  const [mode, setMode] = useState("list")
  const { data } = useSWR(endpoint.memories)
  console.log({ data })
  return (
    <div className="w-full overflow-y-auto">
      <div className="py-8 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl font-inter leading-[30px] font-semibold">Stats</span>
          <div className="border-t border-[#EBEBEB] flex-1" />
        </div>
        <div className="flex items-center gap-3">
          <StatCard icon={<BookIcon width={20} height={16} />} subtitle="memories added" title="25" />
          <StatCard icon={<BookmarkIcon width={14} height={18} />} subtitle="bookmarks" title="5" />
        </div>
      </div>
      <div className="py-8 space-y-6">
        <MemoriesHeader
          mode={mode}
          onChangeMode={setMode}
          count={data?.data?.totalDocs}
        />
        {
          mode === "grid" ?
            <MemoriesGrid data={data?.data} /> :
            <MemoriesTable data={data?.data} />
        }
      </div>
    </div>
  )
}