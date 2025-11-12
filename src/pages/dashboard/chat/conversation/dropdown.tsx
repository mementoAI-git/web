import { InfoIcon, TrashIcon, VerticalEllipseIcon } from "@/components/icons";
import {
  DropdowmIcon,
} from "@/components/Dropdown";
import { useModal } from "@/hooks/use-modal";
import { type IMemory } from "@/utility/interface";

interface IMemoryDropdownProps {
  memory: IMemory
  onViewDetails?: () => void
}

export function MemoryDropdown({ memory, onViewDetails }: IMemoryDropdownProps) {
  const { open } = useModal()

  const handleSelect = (value: string) => {
    if (value === "share-story") {
      open("share-memory", { memory })
    }
    if (value === "view-details") {
      onViewDetails()
    }
  }

  return (
    <DropdowmIcon
      icon={<VerticalEllipseIcon className="!size-full cursor-pointer stroke-1" />}
      className="!size-7 sm:!size-8 !p-2 flex justify-center items-center"
      items={[
        {
          label: "View Details",
          value: "view-details",
          startIcon: <InfoIcon className="stroke-2" />,
        },
      ]}
      footerItem={
        < li
          onClick={() => open("delete-memory", memory._id)}
          className="flex cursor-pointer items-center rounded gap-2.5 px-2.5 py-1.5 hover:bg-[#F97066]/8 text-[#F97066]"
        >
          <TrashIcon width={16} height={16} />
          <span className="font-inter text-sm">Delete</span>
        </li >
      }
      onSelect={handleSelect}
    />
  );
}
