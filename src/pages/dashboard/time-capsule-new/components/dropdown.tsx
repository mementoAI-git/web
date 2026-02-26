import { DropdowmIcon } from "@/components/Dropdown";
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

  const handleSelect = async (value: string) => {
    if (value === "edit-capsule") {
      open("edit-capsule", capsule);
    }

    if (value === "view-capsule") {
      open("view-capsule", capsule);
    }

    if (value === "pause-capsule") {
      open("pause-capsule", capsule);
    }
  };

  return (
    <DropdowmIcon
      icon={<VerticalEllipseIcon className="w-1 h-3" />}
      items={
        capsule.status == "deleted"
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
            {
              label: "Edit",
              value: "edit-capsule",
              startIcon: <EditIcon width={16} />,
            },
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
            {
              // label: memory.bookmarked ? "Remove bookmark" : "Add bookmark",
              label:
                capsule.status === "draft"
                  ? "Schedule"
                  : capsule.status === "scheduled"
                    ? "Freeze"
                    : capsule.status === "paused"
                      ? "Unfreeze"
                      : "",
              value: "capsule",
              startIcon:
                capsule.status === "scheduled" ? (
                  <RemoveBookmarkIcon width={16} height={16} />
                ) : (
                  <AddBookmarkIcon width={16} height={16} />
                ),
            },
          ]
      }
      footerItem={
        <li
          onClick={() => open("delete-capsule", capsule._id)}
          className="flex cursor-pointer items-center rounded gap-2.5 px-2.5 py-1.5 hover:bg-[#F97066]/8 text-[#F97066]"
        >
          <TrashIcon width={16} />
          <span className="font-inter text-sm">Delete</span>
        </li>
      }
      onSelect={handleSelect}
      className="right-0! bottom-8!"
    />
  );
}