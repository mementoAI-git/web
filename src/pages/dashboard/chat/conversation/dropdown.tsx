import { EditIcon, InfoIcon, TrashIcon } from "@/components/icons";
import { Download, Info } from "lucide-react";
import { DropdownIcon } from "@/components/Dropdown";
import { useModal } from "@/hooks/use-modal";
import { type IMemory } from "@/utility/interface";

interface IMemoryDropdownProps {
  memory: IMemory;
  onViewDetails?: () => void;
  onExportConversation?: () => void;
  /** Passed to the trigger `DropdownIcon` (e.g. v3 header chips). */
  triggerClassName?: string;
}

export function MemoryDropdown({
  memory,
  onViewDetails,
  onExportConversation,
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
    if (value === "edit-memory") {
      push("edit-memory", { memory });
    }
    if (value === "export-conversation" && onExportConversation) {
      onExportConversation();
    }
  };

  return (
    <DropdownIcon
      icon={
        <Info className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
      }
      className={
        triggerClassName ??
        "!size-7 sm:!size-8 !p-2 flex items-center justify-center bg-transparent transition-colors hover:bg-v3-fill-weak"
      }
      items={[
        {
          label: "View Details",
          value: "view-details",
          startIcon: <InfoIcon className="stroke-2" />,
        },
        {
          label: "Edit memory",
          value: "edit-memory",
          startIcon: <EditIcon className="stroke-2" />,
        },
        ...(onExportConversation
          ? [
              {
                label: "Export conversation",
                value: "export-conversation",
                startIcon: <Download className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />,
              },
            ]
          : []),
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
