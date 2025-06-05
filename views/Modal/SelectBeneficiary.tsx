import endpoint from "@/api/endpoint";
import { Checkbox } from "@/components/Form";
import { ModalCloseBtn } from "@/components/ModalLayout";
import UserItem from "@/components/UserItem";
import { useModal } from "@/hooks/use-modal";
import { isEmpty } from "@/utility";
import { IBeneficiary } from "@/utility/interface";
import { useState } from "react";
import useSWR from "swr";

interface ISelectBeneficiary {
  handleClose: () => void
  onAddRecipient: (a: string[]) => void
}

export default function SelectBeneficiary({ onAddRecipient, handleClose }: ISelectBeneficiary) {
  const [page, setPage] = useState(1)
  const [values, setValues] = useState([])
  const { data, isLoading } = useSWR(`${endpoint.beneficiaries}?page=${page}`)

  const handleCheck = (b: IBeneficiary) => {
    if (values.includes(b.email)) return;
    setValues(p => [...p, b.email])
  }

  const handleAddRecipient = () => {
    onAddRecipient(values)
    handleClose()
  }
  return (
    <div className="modal-container">
      <ModalCloseBtn onClick={handleClose} />
      <div className="space-y-6">
        <h4 className="modal-title">Select beneficiaries</h4>
        <small className="font-inter text-sm text-grey-600">You can select multiple beneficiaries to add as recepients.</small>

        <ul className="mt-6 space-y-4">
          {
            !isLoading &&
              isEmpty(data?.data) ?
              <span>You have no Beneficiary</span> :
              data?.data?.docs?.map((b, i) => (
                <li key={i} className="flex justify-between py-2 pb-4 last:border-0 border-b border-[#F2F4F7]">
                  <UserItem {...b} />
                  <Checkbox
                    checked={values.includes(b.email)}
                    onChange={() => handleCheck(b)}
                  />
                </li>
              ))
          }
        </ul>
        <button onClick={handleAddRecipient} className="btn ml-auto">Add as recipient</button>
      </div>
    </div>
  )
}