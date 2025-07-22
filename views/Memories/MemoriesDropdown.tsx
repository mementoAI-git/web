import VeriticalElipseIcon from "@/public/icon/vertical-ellipse.svg";
import EditIcon from "@/public/icon/edit.svg";
import TrashIcon from "@/public/icon/trash.svg";
import LunchIcon from "@/public/icon/lauch.svg";
import BookmarkIcon from "@/public/icon/dashboard/bookmark.svg";
import FilterIcon from "@/public/icon/filter.svg";
import {
  CheckboxOption,
  DropdowmIcon,
  DropdownButton,
} from "@/components/Dropdown";
import { useModal } from "@/hooks/use-modal";
import { IMemory } from "@/utility/interface";
import RemoveBookmarkIcon from "@/public/icon/remove-bookmark.svg";
import AddBookmarkIcon from "@/public/icon/add-bookmark.svg";

const FILTER_LABELS = {
  all: "All",
  bookmarked: "Bookmarked",
  deleted: "Deleted"
};

export function MemoryItemActions({ memory }: { memory: IMemory }) {
  const { open } = useModal()

  const handleSelect = (value: string) => {
    if (value === "share-story") {
      open("share-post", memory?._id)
    }
    if (value === "edit-memory") {
      open("edit-memory", memory)
    }
    if (value === "bookmark") {
      open("bookmark-memory", memory)
    }
  }

  return (
    <DropdowmIcon
      icon={<VeriticalElipseIcon />}
      items={[
        {
          label: "Edit story",
          value: "edit-memory",
          startIcon: <EditIcon width={16} size={16} />,
        },
        {
          label: "Share story",
          value: "share-story",
          startIcon: <LunchIcon width={16} size={16} />,
        },
        {
          label: "Book mark",
          value: "bookmark",
          startIcon: memory.bookmarked ?
            <RemoveBookmarkIcon width={16} height={16} />
            : <AddBookmarkIcon width={16} height={16} />
        },
      ]}
      footerItem={
        <li
          onClick={() => open("delete-memory", memory._id)}
          className="flex cursor-pointer items-center gap-2.5 px-1 py-2 text-[#F97066]"
        >
          <TrashIcon width={16} size={16} />
          <span className="font-inter text-sm">Delete</span>
        </li>
      }
      onSelect={handleSelect}
      className="!right-0 !bottom-8"
    />
  );
}

export function MemoryListFilter({ value = "all", onChange }: { value: string, onChange: (v: string) => void }) {
  return (
    <DropdownButton
      title={
        <div className="flex items-center gap-1">
          <FilterIcon />
          <span>filter: {FILTER_LABELS[value] || value}</span>
        </div>
      }
      onSelect={onChange}
      ItemLayout={({ onClick, item }) => <CheckboxOption {...{ onClick, item, value }} />}
      items={[
        { label: "All", value: "all" },
        { label: "Bookmarked", value: "bookmarked" },
        { label: "Deleted", value: "deleted" },
      ]}
      value={value}
    />
  );
}
