import dayjs from "dayjs";
import { useModal } from "@/hooks/use-modal";
import type { IGroup } from "@/utility/interface";
import { EditIcon, TrashIcon, UsersIcon } from "@/components/icons";

interface GroupRowProps {
  group: IGroup;
}

export default function GroupRow({ group }: GroupRowProps) {
  const { open } = useModal();

  const handleDeleteClick = () => {
    open?.("delete-group", group?._id);
  };

  const handleEditClick = () => {
    open?.("update-group", group);
  };

  const handleManageClick = () => {
    open?.("group-detail", group?._id);
  };

  return (
    <tr className="font-inter text-xs">
      <td className="pr-3">
        <div className="max-w-[170px] truncate font-medium text-gray-950/90">
          {group?.name || "—"}
        </div>
      </td>
      <td>
        {group?.created_at
          ? dayjs(group.created_at).format("MMM DD, YYYY")
          : "—"}
      </td>
      <td className="max-w-[140px] truncate text-gray-500">
        {group?.description || "—"}
      </td>
      <td>
        <span className="mem-tags !text-xs">
          {Array.isArray(group?.members) ? group.members.length : 0}{" "}
          {Array.isArray(group?.members) && group.members.length === 1 ? "member" : "members"}
        </span>
      </td>
      <td>
        <div className="flex items-center justify-end gap-3 text-secondary">
          <button
            type="button"
            className="cursor-pointer text-gray-500"
            onClick={handleManageClick}
            title="Manage members"
          >
            <UsersIcon width={16} height={16} />
          </button>
          <button type="button" className="cursor-pointer text-gray-500" onClick={handleEditClick}>
            <EditIcon width={16} height={16} />
          </button>
          <button type="button" className="cursor-pointer text-gray-500" onClick={handleDeleteClick}>
            <TrashIcon width={16} height={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}
