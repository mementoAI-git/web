import "../stories-motion.css";
import { SearchIcon } from "@/components/icons";
import { useModal } from "@/hooks/use-modal";
import { storageKeys } from "@/utility/constant";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TypographyMuted } from "@/components/ui/typography";
import { LayoutGrid, List } from "lucide-react";
import { SearchCommandShortcut } from "@/components/search-command-shortcut";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface IStoriesHeader {
  mode?: string;
  onChangeMode: (m: string) => void;
}

interface StoriesFiltersProps {
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
}: IStoriesHeader) {
  const { open } = useModal();

  const handleChangeMode = (m: string) => {
    if (!m) return;
    localStorage.setItem(storageKeys.listmode, m);
    onChangeMode(m);
  };

  return (
    <div
      data-slot="stories-sticky-search"
      className="stories-search-surface sticky top-4 z-[46] flex items-center gap-3 pb-3"
    >
      <Button
        type="button"
        variant="ghost"
        aria-label="Search memories"
        onClick={() => open("search-memory")}
        className="h-12 min-w-0 flex-1 justify-start gap-3 rounded-xl border border-stroke-neutral-weak bg-fill-neutral-weak px-4 text-text-neutral-weak hover:bg-fill-neutral-weaker hover:text-text-neutral-strong"
      >
        <SearchIcon data-icon="inline-start" className="icon-neutral-weak" />
        <TypographyMuted className="flex-1 text-left font-inter text-base text-text-neutral-weak">
          Search
        </TypographyMuted>
        <SearchCommandShortcut className="hidden sm:inline-flex" />
      </Button>

      <ToggleGroup
        type="single"
        spacing={0}
        value={mode}
        onValueChange={handleChangeMode}
        aria-label="Memory view"
        data-mode={mode}
        className="stories-view-toggle shrink-0 rounded-full bg-fill-neutral-weaker p-1"
      >
        <ToggleGroupItem
          value="grid"
          aria-label="Grid view"
          className={cn(
            "rounded-[100px] p-2 text-icon-neutral-weak transition-colors duration-150 data-[state=on]:bg-fill-neutral-weak data-[state=on]:text-icon-neutral-strong motion-reduce:transition-none",
            "hover:bg-transparent",
          )}
        >
          <LayoutGrid />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="list"
          aria-label="List view"
          className={cn(
            "rounded-[100px] p-2 text-icon-neutral-weak transition-colors duration-150 data-[state=on]:bg-fill-neutral-weak data-[state=on]:text-icon-neutral-strong motion-reduce:transition-none",
            "hover:bg-transparent",
          )}
        >
          <List />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

export function StoriesFilters({
  filter,
  onChangeFilter,
  count = 0,
  bookmarkedCount = 0,
  deletedCount = 0,
}: StoriesFiltersProps) {
  const filters = [
    { label: "All", value: "all", count },
    { label: "Bookmarked", value: "bookmarked", count: bookmarkedCount },
    { label: "Deleted", value: "deleted", count: deletedCount },
  ];

  return (
    <Tabs
      value={filter}
      onValueChange={(value) => onChangeFilter(String(value))}
      className="gap-0"
    >
      <TabsList
        aria-label="Filter memories"
        className="stories-filter-tabs h-auto w-full flex-wrap justify-start gap-3 rounded-none bg-transparent p-0 group-data-horizontal/tabs:h-auto"
      >
        {filters.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            aria-label={`${item.label} ${item.count}`}
            className="inline-flex h-8 flex-none items-center rounded-full bg-fill-neutral-weak px-3 font-inter text-xs font-medium text-text-neutral-weak transition-[background-color,color] duration-150 ease-out hover:bg-fill-neutral-weak hover:text-text-neutral-strong data-active:bg-fill-tab-active data-active:text-text-tab-active dark:data-active:bg-fill-tab-active dark:data-active:text-text-tab-active dark:data-active:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-neutral-strong focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            {item.label}
            <span className="font-inter text-xs font-normal text-current opacity-70">
              {item.count}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
