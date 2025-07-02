"use client";

import { DropdownButton } from "@/components/Dropdown";
import { Searchinput } from "@/components/Form";

import GridIcon from "@/public/icon/dashboard/grid.svg";
import ListIcon from "@/public/icon/dashboard/list.svg";
import PlusIcon from "@/public/icon/plus.svg"

import { MemoryListFilter } from "./MemoriesDropdown";
import { useModal } from "@/hooks/use-modal";
import { storageKeys } from "@/utility/constant";
import { cn } from "@/utility";

interface IMemoriesHeader {
  mode?: string;
  onChangeMode: (m: string) => void;
  count?: number;
}

export default function MemoriesHeader({ count = 0, mode = "list", onChangeMode }: IMemoriesHeader) {
  const { open } = useModal()

  const handleChangeMode = (m: string) => {
    localStorage.setItem(storageKeys.listmode, m)
    onChangeMode(m)
  }
  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex flex-row items-center sm:items-center justify-between gap-2 sm:gap-0">
        <div className="flex items-center gap-2">
          <span className="font-inter text-lg sm:text-xl leading-[30px] font-semibold text-grey-900">
            My memories
          </span>
          <span className="block rounded-full bg-grey-500 px-3 py-0.5 font-inter text-xs text-grey-600">
            {count} post{count > 1 && "s"}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
          {
            ["grid", "list"].map(m => (
              <div
                key={m}
                onClick={() => handleChangeMode(m)}
                className={`${mode === m ? "text-[#2E90FA] bg-[#EFF8FF]" : "text-[#3C3F3E]"}  hover:text-[#2E90FA] flex items-center cursor-pointer justify-center rounded-full w-9 sm:w-10 aspect-square bg-surface-100 hover:bg-[#EFF8FF]`}
              >
                {m === "list" ? <ListIcon /> : <GridIcon />}
              </div>
            ))
          }
        </div>
      </div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0">
        <div className="flex flex-wrap lg:max-h-10 items-center gap-2 sm:gap-4">
          <MemoryListFilter />
          <div className="h-[25px] border-r border-grey-500" />
          <DropdownButton
            items={[{ label: "All", value: "all" }]}
            title="Tags"
            onSelect={console.log}
          />
        </div>
        <div className="flex flex-col sm:flex-row items-stretch lg:max-h-10 gap-2 sm:gap-3 mt-2 sm:mt-0 w-full sm:w-auto">
          <div onClick={() => open("search-memory")}
            className="w-full sm:w-auto">
            <Searchinput />
          </div>
          <button onClick={() => open("create-memory")} className={cn("btn", "!rounded-lg w-full sm:w-fit")}>
            <PlusIcon width={15} />
            <span>Add Memory</span>
          </button>
        </div>
      </div>
    </div>
  );
}
