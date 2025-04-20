"use client"

import { DropdownButton } from "@/components/Dropdown"
import { Searchinput } from "@/components/Form"
import GridIcon from "@/public/icon/dashboard/grid.svg"
import ListIcon from "@/public/icon/dashboard/list.svg"
import { MemoryListFilter } from "./MemoriesDropdown"

interface IMemoriesHeader {
  mode?: string
  onChangeMode: (m: string) => void
  count?: number
}

export default function MemoriesHeader({ count = 0, mode = "list", onChangeMode }: IMemoriesHeader) {
  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-inter font-semibold text-grey-900 text-xl leading-[30px]">My memories</span>
          <span className="block py-0.5 px-3 rounded-full text-xs font-inter text-grey-600 bg-grey-500">{count} post{count > 1 && "s"}</span>
        </div>
        <div className="flex items-center gap-3">
          {
            ["grid", "list"].map(m => (
              <div
                key={m}
                onClick={() => onChangeMode(m)}
                className={`${mode === m ? "text-[#2E90FA] bg-[#EFF8FF]" : "text-[#3C3F3E]"}  hover:text-[#2E90FA] flex items-center cursor-pointer justify-center rounded-full w-10 aspect-square bg-surface-100 hover:bg-[#EFF8FF]`}
              >
                {m === "list" ? <ListIcon /> : <GridIcon />}
              </div>
            ))
          }
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="max-h-10 gap-4 flex items-center">
          <MemoryListFilter />
          <div className="h-[25px] border-r border-grey-500" />
          <DropdownButton
            items={[{ label: "All", value: "all" }]}
            title="Tags"
            onSelect={console.log}
          />
          <DropdownButton
            items={[{ label: "All", value: "all" }]}
            title="Type"
            onSelect={console.log}
          />
        </div>
        <div className="max-w-80 flex-1">
          <Searchinput />
        </div>
      </div>
    </div>
  )
}