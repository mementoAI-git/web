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

export function MemoryItemActions({ memory }: { memory: IMemory }) {
  const { open } = useModal()

  const handleSelect = (value: string) => {
    if (value === "share-story") {
      open("share-post", memory?._id)
    }
    if (value === "edit-memory") {
      open("edit-memory", memory)
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
          startIcon: (
            <BookmarkIcon
              className="h-[16px] w-[16px]"
              width={16}
              height={16}
            />
          ),
        },
      ]}
      footerItem={
        <li className="flex cursor-pointer items-center gap-2.5 px-1 py-2 text-[#F97066]">
          <TrashIcon width={16} size={16} />
          <span className="font-inter text-sm">Delete</span>
        </li>
      }
      onSelect={handleSelect}
      className="!right-0 !bottom-8"
    />
  );
}

export function MemoryListFilter() {
  return (
    <DropdownButton
      title={
        <div className="flex items-center gap-1">
          <FilterIcon />
          <span>filter: all</span>
        </div>
      }
      onSelect={console.log}
      ItemLayout={CheckboxOption}
      items={[
        { label: "All", value: "all" },
        { label: "Bookmarked", value: "bookmarked" },
        { label: "Deleted", value: "deleted" },
        { label: "Bookmarked", value: "bookmarked" },
      ]}
    />
  );
}
