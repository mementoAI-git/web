import dayjs from "dayjs";
import { useModal } from "@/hooks/use-modal";
import type { IGroup } from "@/utility/interface";
import { SettingsPillButton } from "../../settings-action-row";

const compactPill = "!min-h-9 px-3 py-1.5 text-xs";

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
        <div className="max-w-[170px] truncate font-medium text-v3-text-strong">{group?.name || "—"}</div>
      </td>
      <td>{group?.created_at ? dayjs(group.created_at).format("MMM DD, YYYY") : "—"}</td>
      <td className="max-w-[140px] truncate text-v3-text-weak">{group?.description || "—"}</td>
      <td>
        <span className="mem-tags !text-xs">
          {Array.isArray(group?.members) ? group.members.length : 0}{" "}
          {Array.isArray(group?.members) && group.members.length === 1 ? "member" : "members"}
        </span>
      </td>
      <td>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <SettingsPillButton type="button" variant="default" className={compactPill} onClick={handleManageClick}>
            Members
          </SettingsPillButton>
          <SettingsPillButton type="button" variant="default" className={compactPill} onClick={handleEditClick}>
            Edit
          </SettingsPillButton>
          <SettingsPillButton type="button" variant="destructive" className={compactPill} onClick={handleDeleteClick}>
            Remove
          </SettingsPillButton>
        </div>
      </td>
    </tr>
  );
}
