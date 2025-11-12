import dayjs from "dayjs";
import { useModal } from "@/hooks/use-modal";
import UserItem from "@/components/user-item";
import { cn, isEmpty } from "@/utility";
import { tagColors } from "@/utility/constant";
import type { IBeneficiary } from "@/utility/interface";
import { EditIcon, RefreshIcon, TrashIcon } from "@/components/icons";

interface BeneficiaryRowProps {
  beneficiary: IBeneficiary;
}

export default function BeneficiaryRow({ beneficiary }: BeneficiaryRowProps) {
  const { open } = useModal();

  const handleDeleteClick = () => {
    open?.("delete-beneficiary", beneficiary?._id);
  };

  const handleEditClick = () => {
    open?.("update-beneficiary", beneficiary);
  };

  const handleResendInvite = () => {
    open?.("resend-invite", beneficiary);
  };

  return (
    <tr className="font-inter text-xs">
      <td className="pr-3">
        <div className="max-w-[170px] truncate">
          <UserItem {...beneficiary} imageClassName="!size-[32px] !text-base" />
        </div>
      </td>
      <td>
        {isEmpty(beneficiary.accepted_at) ? (
          <span className={cn("mem-tags", tagColors[beneficiary?.status as keyof typeof tagColors])}>
            {beneficiary?.status}
          </span>
        ) : (
          dayjs(beneficiary.accepted_at).format("MMM DD, YYYY")
        )}
      </td>
      <td className="capitalize">{beneficiary?.relationship || ""}</td>
      <td>
        <span className="mem-tags !text-xs">Level {beneficiary?.level}</span>
      </td>
      <td>
        <div className="flex items-center justify-end gap-3 text-secondary">
          {isEmpty(beneficiary.accepted_at) && (
            <button
              type="button"
              className="cursor-pointer text-gray-500"
              onClick={handleResendInvite}
            >
              <RefreshIcon width={15} height={15} />
            </button>
          )}
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

