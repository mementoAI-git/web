import EditIcon from "@/public/icon/edit.svg";
import TrashIcon from "@/public/icon/bin.svg";
import dayjs from "dayjs";
import { useModal } from "@/hooks/use-modal";
import UserItem from "@/components/UserItem";

export default function BeneficiaryRow({ beneficiary }) {
  const { open } = useModal()

  const handleDeleteClick = () => {
    open("delete-beneficiary", beneficiary?._id)
  }

  const handleEditClick = () => {
    open("update-beneficiary", beneficiary)
  }
  return (
    <tr className="font-inter">
      <td>
        <UserItem {...beneficiary} />
      </td>
      <td>{dayjs(beneficiary.created_at).format("MMM DD, YYYY")}</td>
      <td>{beneficiary?.relationship || ""}</td>
      <td><span className="mem-tags">Level {beneficiary?.level}</span></td>
      <td>
        <div className="flex items-center justify-end gap-2 text-secondary">
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