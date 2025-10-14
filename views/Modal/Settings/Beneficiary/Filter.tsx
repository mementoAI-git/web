import { DropdownButton } from "@/components/Dropdown";
import FilterIcon from "@/public/icon/filter.svg";

export default function BeneficiaryFilter() {
  return (
    <DropdownButton
      title={
        <div className="flex items-center gap-1">
          <FilterIcon />
          <span>filter: all</span>
        </div>
      }
      onSelect={console.log}
      items={[
        { label: "All", value: "all" },
        { label: "Bookmarked", value: "bookmarked" },
        { label: "Deleted", value: "deleted" },
        { label: "Bookmarked", value: "bookmarked" },
      ]}
    />
  )
}