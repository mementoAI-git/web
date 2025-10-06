"use client";

import { useState } from "react";
import { Searchinput } from "@/components/Form";

import GridIcon from "@/public/icon/dashboard/grid.svg";
import ListIcon from "@/public/icon/dashboard/list.svg";
import PlusIcon from "@/public/icon/plus.svg"
import FilterIcon from "@/public/icon/filter.svg";

import { useModal } from "@/hooks/use-modal";
import { storageKeys } from "@/utility/constant";
import { cn } from "@/utility";
import { useEffect } from "react";

import { MemoryListFilter } from "./MemoriesFilter";

interface IMemoriesHeader {
  mode?: string;
  onChangeMode: (m: string) => void;
  count?: number;
  filter: string;
  onChangeFilter: (f: string) => void;
}

export default function MemoriesHeader({
  count = 0,
  mode = "list",
  onChangeMode,
  filter,
  onChangeFilter
}: IMemoriesHeader) {
  const { open } = useModal()
  const [showFilter, setShowFilter] = useState(false)

  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const handleSetDateRange = (range: { from?: Date; to?: Date }) => {
    setDateRange(range);
    onChangeFilter("custom-date");
  };

  const handleChangeMode = (m: string) => {
    localStorage.setItem(storageKeys.listmode, m)
    onChangeMode(m)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        open("search-memory");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const formatDate = (date?: Date) =>
    date
      ? date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "";

  const hasDateRange = dateRange.from && dateRange.to;

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex flex-row items-center sm:items-center justify-between gap-2 sm:gap-0">
        {/* <div className="flex items-center gap-2">
          <span className="font-inter text-lg sm:text-xl leading-[30px] font-semibold text-grey-900">
            My memories
          </span>
          <span className="block rounded-full bg-grey-500 px-3 py-0.5 font-inter text-xs text-grey-600">
            {count} post{count > 1 && "s"}
          </span>
        </div> */}
        
      </div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0">
        <div className="flex flex-wrap lg:max-h-10 items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setShowFilter(!showFilter)}>
            <FilterIcon />
            <span>filter</span>
          </div>
          {/* <div className="h-[25px] border-r border-grey-500" />
          <DropdownButton
            items={[{ label: "All", value: "all" }]}
            title="Tags"
            onSelect={console.log}
          /> */}
          <div onClick={() => open("search-memory")}
            className="w-full sm:w-auto">
            <Searchinput
              end={<div className="border-grey-500 border rounded py-[1px] px-1 text-[#717680] font-medium font-inter text-xs">⌘K</div>}
            />
          </div>
        </div>
        <div>
          
        </div>
        <div className="flex flex-col sm:flex-row items-stretch lg:max-h-10 gap-2 sm:gap-3 mt-2 sm:mt-0 w-full sm:w-auto">
          <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
            {
              ["grid", "list"].map(m => (
                <div
                  key={m}
                  onClick={() => handleChangeMode(m)}
                  className={`${mode === m ? "text-[#2E90FA] bg-[#EFF8FF]" : "text-[#3C3F3E]"}  hover:text-[#2E90FA] flex items-center cursor-pointer justify-center rounded-full w-9 sm:w-10 aspect-square bg-surface-100 hover:bg-[#EFF8FF]`}
                >
                  {m === "list" ? 
                    <div className="p-[10px] rounded-[10px] border border-[#10182866]"> <ListIcon /> </div>
                    : 
                    <GridIcon /> 
                  }
                </div>
              ))
            }
          </div>
          {/* <button onClick={() => open("create-memory")} className={cn("btn", "!rounded-lg w-full sm:w-fit")}>
            <PlusIcon width={15} />
            <span>Add Memory</span>
          </button> */}
        </div>
      </div>
      {showFilter && (
        <div className="flex flex-col md:flex-row gap-3">
          <MemoryListFilter 
            value={filter} 
            onChange={onChangeFilter} 
            onSetDateRange={handleSetDateRange} 
          />
          
          {hasDateRange && (
            <div className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 flex items-center justify-between">
              <span>
                {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
              </span>
              <button
                onClick={() => {
                  setDateRange({});
                  onChangeFilter("all");
                }}
                className="text-gray-500 hover:text-gray-700 text-xs ml-4"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}