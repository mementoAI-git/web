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
      className="sticky top-4 z-40 flex items-center gap-3 bg-background pb-3 before:absolute before:inset-x-0 before:-top-4 before:h-4 before:bg-background before:content-['']"
    >
      <Button
        type="button"
        variant="ghost"
        aria-label="Search memories"
        onClick={() => open("search-memory")}
        className="h-12 min-w-0 flex-1 justify-start gap-3 rounded-xl border border-stroke-neutral-weak bg-fill-neutral-weak px-4 text-neutral-weak hover:bg-fill-neutral-weaker hover:text-neutral-strong"
      >
        <SearchIcon data-icon="inline-start" className="icon-neutral-weak" />
        <TypographyMuted className="flex-1 text-left font-inter text-base text-neutral-weak">
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
        className="shrink-0 rounded-full bg-fill-neutral-weaker p-1"
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
        variant="line"
        aria-label="Filter memories"
        className="hide-scrollbar h-11 w-full justify-start gap-7 overflow-x-auto p-0"
      >
        {filters.map((item) => {
          const isActive = filter === item.value;

          return (
            <TabsTrigger
              key={item.value}
              value={item.value}
              aria-label={`${item.label} ${item.count}`}
              style={{
                color: isActive
                  ? "var(--text-neutral-strong)"
                  : "var(--text-neutral-weak)",
              }}
              className="h-11 flex-none rounded-none border-0 px-0 font-inter text-sm font-medium transition-colors duration-150 after:bottom-0 after:left-1/2 after:right-auto after:w-6 after:-translate-x-1/2 after:rounded-full after:bg-neutral-strong hover:text-neutral-strong data-active:after:opacity-100 motion-reduce:transition-none sm:text-base"
            >
              {item.label}
              <span className="font-inter text-xs font-normal text-neutral-weaker">
                {item.count}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
