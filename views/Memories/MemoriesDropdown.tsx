import VeriticalElipseIcon from "@/public/icon/vertical-ellipse.svg"
import EditIcon from "@/public/icon/edit.svg"
import TrashIcon from "@/public/icon/trash.svg"
import LunchIcon from "@/public/icon/lauch.svg"
import BookmarkIcon from "@/public/icon/dashboard/bookmark.svg"
import FilterIcon from "@/public/icon/filter.svg"
import { CheckboxOption, DropdowmIcon, DropdownButton } from "@/components/Dropdown";

export function MemoryItemActions() {
  return (
    <DropdowmIcon
      icon={<VeriticalElipseIcon />}
      items={[
        { label: "Edit story", value: "edit-story", startIcon: <EditIcon width={16} size={16} /> },
        { label: "Share story", value: "share-story", startIcon: <LunchIcon width={16} size={16} /> },
        { label: "Book mark", value: "bookmark", startIcon: <BookmarkIcon className="w-[16px] h-[16px]" width={16} height={16} /> }
      ]}
      footerItem={
        <li className="cursor-pointer flex items-center py-2 px-1 gap-2.5 text-[#F97066]">
          <TrashIcon width={16} size={16} />
          <span className="font-inter text-sm">Delete</span>
        </li>
      }
      onSelect={console.log}
      className="!right-0 !bottom-8"
    />
  )
}

export function MemoryListFilter() {
  return (
    <DropdownButton
      title={
        <div className="flex gap-1 items-center">
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
        { label: "Bookmarked", value: "bookmarked" }
      ]}
    />
  )
}