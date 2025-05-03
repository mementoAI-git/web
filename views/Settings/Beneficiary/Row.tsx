import EditIcon from "@/public/icon/edit.svg";
import TrashIcon from "@/public/icon/bin.svg";

export default function BeneficiaryRow() {
  return (
    <tr className="font-inter">
      <td>
        <div className="flex gap-3">
          <div className="size-10 bg-grey-600 rounded-full" />
          <div className="flex flex-col">
            <span className="text-secondary font-medium">Deborah Jackson</span>
            <span>deb@example.com</span>
          </div>
        </div>
      </td>
      <td>Jan 18, 2025</td>
      <td>Brother</td>
      <td><span className="mem-tags">Level 1</span></td>
      <td>
        <div className="flex items-center justify-end gap-2 text-secondary">
          <EditIcon width={16} size={16} />
          <TrashIcon width={16} size={16} />
        </div>
      </td>
    </tr >
  )
}