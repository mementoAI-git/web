import { DropdownIcon } from "@/components/Dropdown";
import { useModal } from "@/hooks/use-modal";
import type { ICapsule } from "@/utility/interface";
import {
  AddBookmarkIcon,
  VerticalEllipseIcon,
  EditIcon,
  LaunchIcon,
  RemoveBookmarkIcon,
  TrashIcon,
  RestoreIcon,
} from "@/components/icons";

export function CapsuleItemActions({ capsule }: { capsule: ICapsule }) {
  const { open } = useModal();

  const handleSelect = (value: string) => {
    const data = ["edit-capsule", "view-capsule"].includes(value)
      ? capsule
      : capsule._id;

    open(value, data);
  };

  const STATUS_ACTION_MAP = {
    draft: {
      label: "Schedule",
      value: "schedule-capsule",
      startIcon: <AddBookmarkIcon width={16} height={16} />,
    },
    scheduled: {
      label: "Freeze",
      value: "pause-capsule",
      startIcon: <RemoveBookmarkIcon width={16} height={16} />,
    },
    pause: {
      label: "Unfreeze",
      value: "unpause-capsule",
      startIcon: <AddBookmarkIcon width={16} height={16} />,
    },
  };

  return (
    <DropdownIcon
      icon={<VerticalEllipseIcon className="w-1 h-3" />}
      items={
        capsule.status === "deleted"
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
              ...(capsule.status !== "delivered"
                ? [
                    {
                      label: "Edit",
                      value: "edit-capsule",
                      startIcon: <EditIcon width={16} />,
                    },
                  ]
                : []),
              {
                label: "View",
                value: "view-capsule",
                startIcon: (
                  <LaunchIcon
                    className="size-3.5"
                    strokeWidth={1.5}
                    width={14}
                  />
                ),
              },
              ...(STATUS_ACTION_MAP[capsule.status]
                ? [STATUS_ACTION_MAP[capsule.status]]
                : []),
            ]
      }
      footerItem={
        capsule.status !== "deleted" && capsule.status !== "delivered" ? (
          <li
            onClick={() => open("delete-capsule", capsule._id)}
            className="flex cursor-pointer items-center rounded gap-2.5 px-2.5 py-1.5 hover:bg-[#F97066]/8 text-[#F97066]"
          >
            <TrashIcon width={16} />
            <span className="font-inter text-sm">Delete</span>
          </li>
        ) : null
      }
      onSelect={handleSelect}
      className="right-0! bottom-8!"
    />
  );
}
