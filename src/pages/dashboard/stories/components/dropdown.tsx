import {
  CheckboxOption,
  DropdownIcon,
  DropdownButton,
} from "@/components/Dropdown";
import { useModal } from "@/hooks/use-modal";
import type { IMemory } from "@/utility/interface";
import { useBookmark } from "@/hooks/use-bookmark";
import useFetcher from "@/hooks/use-fetcher";
import { resolvePath } from "@/utility";
import endpoint from "@/api/endpoint";
import { mutate } from "swr";
import { toast } from "sonner";
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

  const handleSelect = async (value: string) => {
    if (value === "share-story") {
      open("share-memory", { memory });
    }
    if (value === "edit-memory") {
      open("edit-memory", memory);
    }
    if (value === "bookmark") {
      toggleBookmark();
    }
    if (value === "restore") {
      restoreMemory();
      await mutate(
        (key) =>
          typeof key === "string" && key.startsWith(`${endpoint.stories}`),
      );
      toast.success("Memory restored successfully");
    }
  };

  return (
    <DropdownIcon
      icon={<VerticalEllipseIcon className="w-1 h-3" />}
      items={
        memory.status == "deleted"
          ? [
              {
                label: "Restore",
                value: "restore",
                startIcon: (
                  <RestoreIcon strokeWidth={1.5} width={20} height={20} />
                ),
              },
            ]
          : [
              {
                label: "Edit story",
                value: "edit-memory",
                startIcon: <EditIcon width={16} />,
              },
              {
                label: "Share story",
                value: "share-story",
                startIcon: (
                  <LaunchIcon
                    className="size-[14px]"
                    strokeWidth={1.5}
                    width={14}
                  />
                ),
              },
              {
                label: memory.bookmarked ? "Remove bookmark" : "Add bookmark",
                value: "bookmark",
                startIcon: memory.bookmarked ? (
                  <RemoveBookmarkIcon width={16} height={16} />
                ) : (
                  <AddBookmarkIcon width={16} height={16} />
                ),
              },
            ]
      }
      footerItem={
        <li
          onClick={() => open("delete-memory", { memory })}
          className="flex cursor-pointer items-center rounded gap-2.5 px-2.5 py-1.5 hover:bg-[#F97066]/8 text-[#F97066]"
        >
          <TrashIcon width={16} />
          <span className="font-inter text-sm">Delete</span>
        </li>
      }
      onSelect={handleSelect}
      className="!right-0 !bottom-8"
    />
  );
}

export function MemoryListFilter({
  value = "all",
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <DropdownButton
      title={
        <div className="flex items-center gap-1">
          <FilterIcon />
          <span>filter: {FILTER_LABELS[value] || value}</span>
        </div>
      }
      onSelect={onChange}
      ItemLayout={({ onClick, item }) => (
        <CheckboxOption {...{ onClick, item, value }} />
      )}
      items={[
        { label: "All", value: "all" },
        { label: "Bookmarked", value: "bookmarked" },
        { label: "Deleted", value: "deleted" },
        { label: "Custom date", value: "custom-date" },
      ]}
      value={value}
    />
  );
}
