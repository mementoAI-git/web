import { InfoIcon, TrashIcon, VerticalEllipseIcon } from "@/components/icons";
import { DropdownIcon } from "@/components/Dropdown";
import { useModal } from "@/hooks/use-modal";
import { type IMemory } from "@/utility/interface";

interface IMemoryDropdownProps {
  memory: IMemory;
  onViewDetails?: () => void;
  /** Passed to the trigger `DropdownIcon` (e.g. v3 header chips). */
  triggerClassName?: string;
}

export function MemoryDropdown({
  memory,
  onViewDetails,
  triggerClassName,
}: IMemoryDropdownProps) {
  const { push } = useModal();

  const handleSelect = (value: string) => {
    if (value === "share-story") {
      push("share-memory", { memory });
    }
    if (value === "view-details") {
      if (onViewDetails) {
        onViewDetails();
      } else {
        push("view-memory-details", { memory });
      }
    }
  };

  return (
    <DropdownIcon
      icon={
        <VerticalEllipseIcon className="!size-full cursor-pointer stroke-1 text-current" />
      }
      className={
        triggerClassName ??
        "!size-7 sm:!size-8 !p-2 flex justify-center items-center"
      }
      items={[
        {
          label: "View Details",
          value: "view-details",
          startIcon: <InfoIcon className="stroke-2" />,
        },
      ]}
      footerItem={
        <li
          onClick={() => push("delete-memory", { memory })}
          className="flex cursor-pointer items-center rounded gap-2.5 px-2.5 py-1.5 hover:bg-[#F97066]/8 text-[#F97066]"
        >
          <TrashIcon width={16} height={16} />
          <span className="font-inter text-sm">Delete</span>
        </li>
      }
      onSelect={handleSelect}
    />
  );
}
