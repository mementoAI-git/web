import { SearchIcon } from "@/components/icons";
import { useModal } from "@/hooks/use-modal";
import { storageKeys } from "@/utility/constant";
import { cn } from "@/utility";
import gridIconSvg from "@/assets/icon/Stories/grid-icon.svg";
import listIconSvg from "@/assets/icon/Stories/list-icon.svg";

interface IStoriesHeader {
  mode?: string;
  onChangeMode: (m: string) => void;
  filter: string;
  onChangeFilter: (f: string) => void;
  count?: number;
}

export default function StoriesHeader({
  mode = "list",
  onChangeMode,
  filter,
  onChangeFilter,
  count = 0
}: IStoriesHeader) {
  const { open } = useModal()

  const filters = [
    { label: "All", value: "all", count: count },
    { label: "Bookmarked", value: "bookmarked" },
    { label: "Deleted", value: "deleted" },
  ];

  const handleChangeMode = (m: string) => {
    localStorage.setItem(storageKeys.listmode, m)
    onChangeMode(m)
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => onChangeFilter(f.value)}
              className={cn(
                "px-4 py-2 rounded-full font-inter text-sm font-medium transition-all border",
                filter === f.value
                  ? "bg-[#1D2939] border-[#1D2939] text-white"
                  : "bg-white border-[#EAECF0] text-[#344054] hover:bg-gray-50"
              )}
            >
              {f.label} {f.count !== undefined && <span className="opacity-70 ml-1">({f.count})</span>}
            </button>
          ))}
        </div>

        <div className="flex flex-1 items-center gap-3 max-w-2xl">
          {/* Search Input */}
          <div
            onClick={() => open("search-memory")}
            className="flex-1 group relative cursor-pointer"
          >
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]">
              <SearchIcon className="size-5" />
            </div>
            <div className="w-full pl-10 pr-12 py-2.5 bg-white border border-[#D0D5DD] rounded-xl text-sm text-[#101828] placeholder-[#667085] shadow-sm group-hover:border-gray-400 transition-colors flex items-center">
              Search
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 border border-[#D0D5DD] rounded px-1.5 py-0.5 text-[#667085] font-medium text-[10px] bg-gray-50">
              ⌘K
            </div>
          </div>

          {/* Mode Toggles */}
          <div className="flex items-center p-1 rounded-[64px]" style={{ backgroundColor: "rgba(0,0,0,0.1)" }}>
            {["grid", "list"].map(m => (
              <button
                key={m}
                onClick={() => handleChangeMode(m)}
                className={cn(
                  "p-2 rounded-[64px] transition-all",
                  mode === m ? "bg-white shadow-sm" : ""
                )}
              >
                <img
                  src={m === "grid" ? gridIconSvg : listIconSvg}
                  alt={m}
                  className={cn("size-5 object-contain", mode !== m && "opacity-40")}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}