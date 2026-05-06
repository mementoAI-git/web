import { SearchIcon } from "@/components/icons";
import { useModal } from "@/hooks/use-modal";
import { storageKeys } from "@/utility/constant";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, List } from "lucide-react";

interface IStoriesHeader {
  mode?: string;
  onChangeMode: (m: string) => void;
  filter: string;
  onChangeFilter: (f: string) => void;
  /** Active stories (same as GET /memories/stories? filter=all). */
  count?: number;
  bookmarkedCount?: number;
  deletedCount?: number;
}

export default function StoriesHeader({
  mode = "list",
  onChangeMode,
  filter,
  onChangeFilter,
  count = 0,
  bookmarkedCount = 0,
  deletedCount = 0,
}: IStoriesHeader) {
  const { open } = useModal()

  const filters = [
    { label: "All", value: "all", count: count },
    { label: "Bookmarked", value: "bookmarked", count: bookmarkedCount },
    { label: "Deleted", value: "deleted", count: deletedCount },
  ];

  const handleChangeMode = (m: string) => {
    if (!m) return;
    localStorage.setItem(storageKeys.listmode, m)
    onChangeMode(m)
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => onChangeFilter(f.value)}
              className={cn(
                "rounded-full font-inter text-sm font-medium",
                filter === f.value
                  ? "bg-v3-text-strong text-white hover:bg-v3-text-strong/90"
                  : "border-v3-stroke-weak text-v3-text-weak hover:bg-v3-fill-weaker"
              )}
            >
              {f.label}
              {f.count !== undefined && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-1.5 rounded-full px-1.5 py-0 text-[10px] font-medium",
                    filter === f.value
                      ? "bg-white/20 text-white"
                      : "bg-v3-fill-weaker text-v3-text-weak"
                  )}
                >
                  {f.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        <div className="flex flex-1 items-center gap-3 max-w-2xl">
          {/* Search Input */}
          <button
            type="button"
            onClick={() => open("search-memory")}
            className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-v3-stroke-weak bg-white px-3 py-2.5 shadow-sm transition-colors hover:border-v3-stroke-strong"
          >
            <SearchIcon className="size-5 text-v3-text-weak" />
            <span className="flex-1 text-left text-sm text-v3-text-weak">Search</span>
            <kbd className="rounded border border-v3-stroke-weak bg-v3-fill-weaker px-1.5 py-0.5 font-inter text-[10px] font-medium text-v3-text-weak">
              ⌘K
            </kbd>
          </button>

          {/* Mode Toggles */}
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={handleChangeMode}
            className="rounded-full bg-v3-fill-weak p-1"
          >
            <ToggleGroupItem
              value="grid"
              aria-label="Grid view"
              className={cn(
                "rounded-[100px] p-2 data-[state=on]:bg-white data-[state=on]:shadow-sm",
                "hover:bg-transparent"
              )}
            >
              <LayoutGrid className={cn("size-5", mode !== "grid" && "opacity-40")} />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="list"
              aria-label="List view"
              className={cn(
                "rounded-[100px] p-2 data-[state=on]:bg-white data-[state=on]:shadow-sm",
                "hover:bg-transparent"
              )}
            >
              <List className={cn("size-5", mode !== "list" && "opacity-40")} />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </div>
  );
}
