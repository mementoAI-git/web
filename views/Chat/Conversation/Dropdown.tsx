import InfoIcon from "@/public/icon/info.svg";
import TrashIcon from "@/public/icon/trash.svg";
import {
  DropdowmIcon,
} from "@/components/Dropdown";
import { useModal } from "@/hooks/use-modal";
import { IMemory } from "@/utility/interface";
import EllipseIcon from "@/public/icon/vertical-ellipse.svg"

interface IMemoryDropdownProps {
  memory: IMemory
  onViewDetails?: () => void
}

export function MemoryDropdown({ memory, onViewDetails }: IMemoryDropdownProps) {
  const { open } = useModal()

  const handleSelect = (value: string) => {
    if (value === "share-story") {
      open("share-post", memory?._id)
    }
    if (value === "view-detilas") {
      onViewDetails()
    }
  }

  return (
    <DropdowmIcon
      icon={<EllipseIcon className="size-[16px] stroke-1 cursor-pointer" />}
      items={[
        {
          label: "View Detils",
          value: "view-detilas",
          startIcon: <InfoIcon className="stroke-2" />,
        },
      ]}
      footerItem={
        <li
          onClick={() => open("delete-memory", memory._id)}
          className="flex cursor-pointer items-center rounded gap-2.5 px-2.5 py-1.5 hover:bg-[#F97066]/8 text-[#F97066]"
        >
          <TrashIcon width={16} size={16} />
          <span className="font-inter text-sm">Delete</span>
        </li>
      }
      onSelect={handleSelect}
    />
  );
}
