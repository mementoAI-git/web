import { Searchinput } from "@/components/Form"
import GridIcon from "@/public/icon/dashboard/grid.svg"
import ListIcon from "@/public/icon/dashboard/list.svg"
import FilterIcon from "@/public/icon/filter.svg"
import Dropdown from "@/components/Dropdown"

export default function MemoriesTableHeader() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-inter font-semibold text-grey-900 text-xl leading-[30px]">My memories</span>
          <span className="block py-0.5 px-3 rounded-full text-xs font-inter text-grey-600 bg-grey-500">25 posts</span>
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
      <div className="flex items-center justify-between">
        <div className="max-h-10 gap-4 flex items-center">
          <Dropdown
            title={
              <div className="flex gap-1 items-center">
                <FilterIcon />
                <span>filter: all</span>
              </div>
            }
          />
          <div className="h-[25px] border-r border-grey-500" />
          <Dropdown title="Tags" />
          <Dropdown title="Type" />
        </div>
        <div className="max-w-80">
          <Searchinput />
        </div>
      </div>
    </div>
  )
}