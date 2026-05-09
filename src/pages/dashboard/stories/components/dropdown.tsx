import { useModal } from "@/hooks/use-modal";
import type { IMemory } from "@/utility/interface";
import { useBookmark } from "@/hooks/use-bookmark";
import useFetcher from "@/hooks/use-fetcher";
import { resolvePath } from "@/utility";
import endpoint from "@/api/endpoint";
import { mutate } from "swr";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AddBookmarkIcon,
  VerticalEllipseIcon,
  EditIcon,
  LaunchIcon,
  RemoveBookmarkIcon,
  TrashIcon,
  FilterIcon,
  RestoreIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

const FILTER_LABELS = {
  all: "All",
  bookmarked: "Bookmarked",
  deleted: "Deleted",
};

export function MemoryItemActions({ memory }: { memory: IMemory }) {
  const { open } = useModal();
  const { trigger: restoreMemory } = useFetcher(
    resolvePath(endpoint.restoreMemory, { id: memory._id }),
  );
  const { toggleBookmark } = useBookmark({
    memoryId: memory._id,
    isBookmarked: memory.bookmarked,
  });

  const handleRestore = async () => {
    await restoreMemory();
    await mutate(
      (key) =>
        typeof key === "string" && key.startsWith(`${endpoint.stories}`),
    );
    toast.success("Memory restored successfully");
  };

  const isDeleted = memory.status === "deleted";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-v3-fill-weaker"
        >
          <VerticalEllipseIcon className="w-1 h-4 text-v3-text-weak" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-32 rounded-lg border border-v3-stroke-weak bg-popover p-0.5 text-popover-foreground shadow-md"
      >
        {isDeleted ? (
          <DropdownMenuItem
            onClick={handleRestore}
            className="cursor-pointer rounded-md px-2 py-1.5 text-xs text-v3-text-strong focus:bg-v3-fill-weaker focus:text-v3-text-strong"
          >
            <RestoreIcon className="mr-1.5 size-3.5" strokeWidth={1.5} />
            Restore
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem
              onClick={() => open("edit-memory", { memory })}
              className="cursor-pointer rounded-md px-2 py-1.5 text-xs text-v3-text-strong focus:bg-v3-fill-weaker focus:text-v3-text-strong"
            >
              <EditIcon className="mr-1.5 size-3.5" />
              Edit story
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => open("share-memory", { memory })}
              className="cursor-pointer rounded-md px-2 py-1.5 text-xs text-v3-text-strong focus:bg-v3-fill-weaker focus:text-v3-text-strong"
            >
              <LaunchIcon className="mr-1.5 size-3.5" strokeWidth={1.5} />
              Share story
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={toggleBookmark}
              className="cursor-pointer rounded-md px-2 py-1.5 text-xs text-v3-text-strong focus:bg-v3-fill-weaker focus:text-v3-text-strong"
            >
              {memory.bookmarked ? (
                <>
                  <RemoveBookmarkIcon className="mr-1.5 size-3.5" />
                  Remove bookmark
                </>
              ) : (
                <>
                  <AddBookmarkIcon className="mr-1.5 size-3.5" />
                  Add bookmark
                </>
              )}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator className="bg-v3-stroke-weak my-1" />
        <DropdownMenuItem
          onClick={() => open("delete-memory", { memory })}
          className="cursor-pointer rounded-md px-2 py-1.5 text-xs text-red-600 focus:bg-red-50 focus:text-red-600"
        >
          <TrashIcon className="mr-1.5 size-3.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface MemoryListFilterProps {
  value?: "all" | "bookmarked" | "deleted";
  onChange: (v: "all" | "bookmarked" | "deleted") => void;
}

export function MemoryListFilter({
  value = "all",
  onChange,
}: MemoryListFilterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-v3-stroke-weak bg-white text-v3-text-strong hover:bg-v3-fill-weaker font-inter text-sm"
        >
          <FilterIcon className="size-4 mr-1.5" />
          Filter: {FILTER_LABELS[value]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-36 rounded-lg border border-v3-stroke-weak bg-popover p-0.5 text-popover-foreground shadow-md"
      >
        {(Object.keys(FILTER_LABELS) as Array<keyof typeof FILTER_LABELS>).map(
          (key) => (
            <DropdownMenuItem
              key={key}
              onClick={() => onChange(key)}
              className={cn(
                "cursor-pointer rounded-md px-2 py-1.5 text-xs",
                value === key
                  ? "bg-v3-fill-weaker text-v3-text-strong"
                  : "text-v3-text-weak focus:bg-v3-fill-weaker focus:text-v3-text-strong"
              )}
            >
              <span className={cn("mr-1.5 flex size-3.5 items-center justify-center", value === key && "text-v3-brand-strong")}>
                {value === key && "✓"}
              </span>
              {FILTER_LABELS[key]}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
