import { DropdownButton } from "@/components/Dropdown";
import { FilterIcon } from "@/components/icons";

export default function BeneficiaryFilter() {
  return (
    <DropdownButton
      title={
        <div className="flex items-center gap-1">
          <FilterIcon width={16} height={16} />
          <span>filter: all</span>
        </div>
      }
      onSelect={() => undefined}
      items={[
        { label: "All", value: "all" },
        { label: "Bookmarked", value: "bookmarked" },
        { label: "Deleted", value: "deleted" },
        { label: "Bookmarked", value: "bookmarked" },
      ]}
    />
  );
}
