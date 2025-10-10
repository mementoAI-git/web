"use client";

import { useState } from "react";
import { Searchinput } from "@/components/Form";

import GridIcon from "@/public/icon/dashboard/grid.svg";
import ListIcon from "@/public/icon/dashboard/list.svg";
import ChevronDown from "@/public/icon/chevron-down.svg";
import FilterIcon from "@/public/icon/filter.svg";
import SearchIcon from "@/public/icon/dashboard/search.svg";
import { useModal } from "@/hooks/use-modal";
import { storageKeys } from "@/utility/constant";
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
      <div className="flex flex-row items-center justify-between gap-2 md:gap-0">
        <div className="flex flex-1 items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white transition-colors cursor-pointer" onClick={() => setShowFilter(!showFilter)}>
            <FilterIcon />
            <span>Filter</span>
            <ChevronDown />
          </div>
          <div
            onClick={() => open("search-memory")}
            className="w-fit sm:w-full"
          >
            <div className="w-10 h-10 flex cursor-pointer bg-white items-center justify-center rounded-lg border border-gray-200 sm:hidden">
              <SearchIcon />
            </div>
            <div className="hidden sm:block max-w-[489px]">
              <Searchinput
                className="bg-white !border-gray-200"
                end={<div className="border-grey-500 border rounded py-[1px] px-1 text-[#717680] font-medium font-inter text-xs">⌘K</div>}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {
            ["grid", "list"].map(m => (
              <div
                key={m}
                onClick={() => handleChangeMode(m)}
                className={`${mode === m ? "border" : "border-0"} rounded-[10px] flex items-center text-gray-500 cursor-pointer justify-center w-9 sm:w-10 aspect-square`}
              >
                {m === "list" ?
                  <ListIcon /> :
                  <GridIcon />
                }
              </div>
            ))
          }
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