import EditIcon from "@/public/icon/edit.svg";
import TrashIcon from "@/public/icon/bin.svg";
import dayjs from "dayjs";
import { useModal } from "@/hooks/use-modal";
import UserItem from "@/components/UserItem";
import { cn, isEmpty } from "@/utility";
import { tagColors } from "@/utility/constant";
import RefreshIcon from "@/public/icon/refresh.svg";

export default function BeneficiaryRow({ beneficiary }) {
  const { open } = useModal()

  const handleDeleteClick = () => {
    open("delete-beneficiary", beneficiary?._id)
  }

  const handleEditClick = () => {
    open("update-beneficiary", beneficiary)
  }

  const handleResendInvite = () => {
    open("resend-invite", beneficiary)
  }
  return (
    <tr className="font-inter">
      <td>
        <UserItem {...beneficiary} />
      </td>
      <td>
        {
          isEmpty(beneficiary.accepted_at) ?
            <span className={cn("mem-tags", tagColors[beneficiary?.status])}>{beneficiary?.status}</span> :
            dayjs(beneficiary.accepted_at).format("MMM DD, YYYY")
        }
      </td>
      <td className="capitalize">{beneficiary?.relationship || ""}</td>
      <td><span className="mem-tags">Level {beneficiary?.level}</span></td>
      <td>
        <div className="flex items-center justify-end gap-3 text-secondary">
          <div className="cursor-pointer" onClick={handleResendInvite}>
            <RefreshIcon width={15} size={15} />
          </div>
          <div className="cursor-pointer" onClick={handleEditClick}>
            <EditIcon width={16} size={16} />
          </div>
          <div className="cursor-pointer" onClick={handleDeleteClick}>
            <TrashIcon width={16} size={16} />
          </div>
        </div>
      </td>
    </tr >
  )
}