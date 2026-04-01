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
        className="w-48 rounded-xl border-v3-stroke-weak bg-white p-1 shadow-lg"
      >
        {isDeleted ? (
          <DropdownMenuItem
            onClick={handleRestore}
            className="rounded-lg px-2.5 py-2 text-sm text-v3-text-strong focus:bg-v3-fill-weaker focus:text-v3-text-strong cursor-pointer"
          >
            <RestoreIcon className="size-4 mr-2" strokeWidth={1.5} />
            Restore
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem
              onClick={() => open("edit-memory", { memory })}
              className="rounded-lg px-2.5 py-2 text-sm text-v3-text-strong focus:bg-v3-fill-weaker focus:text-v3-text-strong cursor-pointer"
            >
              <EditIcon className="size-4 mr-2" />
              Edit story
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => open("share-memory", { memory })}
              className="rounded-lg px-2.5 py-2 text-sm text-v3-text-strong focus:bg-v3-fill-weaker focus:text-v3-text-strong cursor-pointer"
            >
              <LaunchIcon className="size-3.5 mr-2" strokeWidth={1.5} />
              Share story
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={toggleBookmark}
              className="rounded-lg px-2.5 py-2 text-sm text-v3-text-strong focus:bg-v3-fill-weaker focus:text-v3-text-strong cursor-pointer"
            >
              {memory.bookmarked ? (
                <>
                  <RemoveBookmarkIcon className="size-4 mr-2" />
                  Remove bookmark
                </>
              ) : (
                <>
                  <AddBookmarkIcon className="size-4 mr-2" />
                  Add bookmark
                </>
              )}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator className="bg-v3-stroke-weak my-1" />
        <DropdownMenuItem
          onClick={() => open("delete-memory", { memory })}
          className="rounded-lg px-2.5 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
        >
          <TrashIcon className="size-4 mr-2" />
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
        className="w-40 rounded-xl border-v3-stroke-weak bg-white p-1 shadow-lg"
      >
        {(Object.keys(FILTER_LABELS) as Array<keyof typeof FILTER_LABELS>).map(
          (key) => (
            <DropdownMenuItem
              key={key}
              onClick={() => onChange(key)}
              className={cn(
                "rounded-lg px-2.5 py-2 text-sm cursor-pointer",
                value === key
                  ? "bg-v3-fill-weaker text-v3-text-strong"
                  : "text-v3-text-weak focus:bg-v3-fill-weaker focus:text-v3-text-strong"
              )}
            >
              <span className={cn("size-4 mr-2 flex items-center justify-center", value === key && "text-v3-brand-strong")}>
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
