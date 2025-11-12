import endpoint from "@/api/endpoint";
import { Checkbox } from "@/components/Form";
import { ModalCloseBtn } from "./modalLayout";
import UserItem from "@/components/user-item";
import { isEmpty } from "@/utility";
import type { IBeneficiary } from "@/utility/interface";
import { useState } from "react";
import useSWR from "swr";

interface SelectBeneficiaryProps {
  value: string[];
  handleClose: () => void;
  onAddRecipient: (recipients: string[]) => void;
}

export default function SelectBeneficiary({ value = [], onAddRecipient, handleClose }: SelectBeneficiaryProps) {
  const [page] = useState(1);
  const [values, setValues] = useState(value);
  const { data, isLoading } = useSWR(`${endpoint.beneficiaries}?page=${page}`);

  const handleCheck = (beneficiary: IBeneficiary) => {
    if (values.includes(beneficiary.email)) return;
    setValues((prev) => [...prev, beneficiary.email]);
  };

  const handleAddRecipient = () => {
    onAddRecipient(values);
    handleClose();
  };

  return (
    <div className="modal-container">
      <ModalCloseBtn onClick={handleClose} />
      <div className="space-y-6">
        <h4 className="modal-title">Select beneficiaries</h4>
        <small className="font-inter text-sm text-grey-600">
          You can select multiple beneficiaries to add as recipients.
        </small>

        <ul className="mt-6 space-y-4">
          {!isLoading && isEmpty(data?.data) ? (
            <span>You have no Beneficiary</span>
          ) : (
            data?.data?.docs?.map((beneficiary: IBeneficiary, index: number) => (
              <li
                key={`${beneficiary.email}-${index}`}
                className="flex items-center justify-between border-b border-[#F2F4F7] py-2 pb-4 last:border-0"
              >
                <UserItem {...beneficiary} />
                <Checkbox checked={values.includes(beneficiary.email)} onChange={() => handleCheck(beneficiary)} />
              </li>
            ))
          )}
        </ul>
        <button type="button" onClick={handleAddRecipient} className="btn ml-auto">
          Add as recipient
        </button>
      </div>
    </div>
  );
}
