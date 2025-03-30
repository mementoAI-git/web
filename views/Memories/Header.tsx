import GridIcon from "@/public/icon/dashboard/grid.svg"
import ListIcon from "@/public/icon/dashboard/list.svg"

export default function MemoriesTableHeader() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <span>My memories</span>
          <span>25 posts</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[#3C3F3E] hover:text-[#2E90FA] flex items-center cursor-pointer justify-center rounded-full w-10 aspect-square bg-surface-100 hover:bg-[#EFF8FF]">
            <GridIcon />
          </div>
          <div className="text-[#2E90FA] flex items-center cursor-pointer justify-center rounded-full w-10 aspect-square bg-[#EFF8FF]">
            <ListIcon />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between"></div>
    </div>
  )
}