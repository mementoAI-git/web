"use client";

import { useEffect } from "react";
import { Searchinput } from "@/components/Form";
import { GridIcon, ListIcon, SearchIcon } from "@/components/icons";
import { useModal } from "@/hooks/use-modal";
import { storageKeys } from "@/utility/constant";

interface IStoriesHeader {
  mode?: string;
  onChangeMode: (m: string) => void;
  filter: string;
  onChangeFilter: (f: string) => void;
  totalCapsuleCount?: number;
}

const tabs = [
  { id: "all", label: "All" },
  { id: "scheduled", label: "Scheduled" },
  { id: "delivered", label: "Delivered" },
  { id: "draft", label: "Drafts" },
  { id: "paused", label: "Paused" },
  // { id: "failed", label: "Failed" },
];

export default function CapsuleHeader({
  totalCapsuleCount,
  mode = "list",
  onChangeMode,
  filter,
  onChangeFilter,
}: IStoriesHeader) {
  const { open } = useModal();

  const handleChangeMode = (m: string) => {
    localStorage.setItem(storageKeys.listmode, m);
    onChangeMode(m);
  };

  const handleTabChange = (tabId: string) => {
    onChangeFilter(tabId);
  };

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

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex flex-row items-center justify-between gap-2 md:gap-0">
        <div className="flex flex-1 items-center gap-2 sm:gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-3 px-1 py-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-3 whitespace-nowrap py-2 font-inter rounded-full text-sm leading-5 font-medium border border-black/10 transition-colors ${
                  filter === tab.id
                    ? "bg-gray-950 text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {tab.label.toLowerCase() === "all"
                  ? `${tab.label} (${totalCapsuleCount || 0})`
                  : tab.label}
              </button>
            ))}

            <div
              onClick={() => open("search-memory")}
              // onClick={() => open("search-capsule")}
              className="w-fit sm:w-full"
            >
              <div className="w-10 h-10 flex cursor-pointer bg-white items-center justify-center rounded-lg border border-gray-200 sm:hidden">
                <SearchIcon />
              </div>
              <div className="hidden sm:block max-w-[489px]">
                <Searchinput
                  className="bg-white border-gray-200!"
                  end={
                    <div className="border-grey-500 border rounded py-px px-1 text-[#717680] font-medium font-inter text-xs">
                      ⌘K
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {["grid", "list"].map((m) => (
            <div
              key={m}
              onClick={() => handleChangeMode(m)}
              className={`${mode === m ? "border" : "border-0 hover:border-gray-900/20"} hover:border border-gray-900/40 rounded-[10px] flex items-center text-gray-500 cursor-pointer justify-center w-9 sm:w-10 aspect-square`}
            >
              {m === "list" ? (
                <ListIcon width={16} height={16} />
              ) : (
                <GridIcon width={16} height={16} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
