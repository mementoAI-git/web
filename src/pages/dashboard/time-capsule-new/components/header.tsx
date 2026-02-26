"use client";

import { useEffect, useState } from "react";
import { Searchinput } from "@/components/Form";
import { ListIcon } from "@/components/icons";
import { useModal } from "@/hooks/use-modal";
import { storageKeys } from "@/utility/constant";
import useClickAway from "@/hooks/use-clickaway";
import { cn } from "@/utility";
import { ChevronDown, Grid2x2 } from "lucide-react";

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
];

const getTabLabel = (
  tab: { id: string; label: string },
  totalCapsuleCount?: number,
) =>
  tab.id === "all" ? `${tab.label} (${totalCapsuleCount || 0})` : tab.label;

export default function CapsuleHeader({
  totalCapsuleCount,
  mode = "list",
  onChangeMode,
  filter,
  onChangeFilter,
}: IStoriesHeader) {
  const { open } = useModal();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useClickAway(() => setIsOpen(false));

  const activeTab = tabs.find((tab) => tab.id === filter);

  const handleChangeMode = (m: string) => {
    localStorage.setItem(storageKeys.listmode, m);
    onChangeMode(m);
  };

  const handleTabChange = (tabId: string) => {
    onChangeFilter(tabId);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        open("search-memory");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const modeToggle = (
    <div className="flex items-center gap-1 shrink-0">
      {["grid", "list"].map((m) => (
        <div
          key={m}
          onClick={() => handleChangeMode(m)}
          className={`${
            mode === m
              ? "border bg-black text-white"
              : "border-0 hover:border-gray-900/20"
          } hover:border border-gray-900/40 rounded-[10px] flex items-center text-gray-500 cursor-pointer justify-center w-9 sm:w-10 aspect-square`}
        >
          {m === "list" ? (
            <ListIcon width={15} height={15} />
          ) : (
            <Grid2x2 width={15} height={15} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden sm:flex flex-1 flex-col gap-3">
        <div className="flex flex-row items-center justify-between gap-2 md:gap-0">
          <div className="flex flex-1 items-center gap-2 sm:gap-4">
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
                  {getTabLabel(tab, totalCapsuleCount)}
                </button>
              ))}

              <div
                onClick={() => open("search-memory")}
                className="w-fit sm:w-full"
              >
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
          {modeToggle}
        </div>
      </div>

      {/* Mobile */}
      <div className="flex flex-col sm:hidden space-y-2">
        <div className="w-full">
          <Searchinput
            className="bg-white border-gray-200!"
            end={
              <div className="border-grey-500 border rounded py-px px-1 text-[#717680] font-medium font-inter text-xs">
                ⌘K
              </div>
            }
          />
        </div>

        <div className="flex gap-4">
          {/* Custom dropdown */}
          <div ref={dropdownRef} className="relative flex-1">
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="w-full px-3 py-2 rounded-md border-gray-200 shadow-sm text-left border  text-sm leading-5 font-medium font-inter flex items-center justify-between transition-colors"
            >
              <span>
                {activeTab ? getTabLabel(activeTab, totalCapsuleCount) : "All"}
              </span>
              <ChevronDown
                className={cn("w-4 h-4 transition-transform", {
                  "rotate-180": isOpen,
                })}
              />
            </button>

            {isOpen && (
              <div className="absolute top-full mt-2 z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                <div className="py-1">
                  {tabs.map((tab) => (
                    <button
                      type="button"
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors flex items-center justify-between"
                    >
                      <span>{getTabLabel(tab, totalCapsuleCount)}</span>
                      {filter === tab.id && (
                        <span className="w-5 h-5 rounded-full border border-[#5A00E8] flex items-center justify-center">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#5A00E8]" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {modeToggle}
        </div>
      </div>
    </>
  );
}
