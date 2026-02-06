import endpoint from "@/api/endpoint";
import { Checkbox, Searchinput } from "@/components/Form";
import { ModalCloseBtn } from "./modalLayout";
import UserItem from "@/components/user-item";
import { isEmpty } from "@/utility";
import type { IBeneficiary, IMemory } from "@/utility/interface";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { SearchIcon } from "../icons";

interface SelectFromMemoryProps {
  value: string[];
  handleClose: () => void;
  onAddRecipient: (recipients: string[]) => void;
}

export default function SelectFromMemory({
  value = [],
  onAddRecipient,
  handleClose,
}: SelectFromMemoryProps) {
  const [page] = useState(1);
  const [values, setValues] = useState(value);
  // const { data, isLoading } = useSWR(`${endpoint.beneficiaries}?page=${page}`);
  const { data, isLoading } = useSWR(`${endpoint.memories}?page=${page}`);

  useEffect(() => {
    console.log(data, isLoading);
    console.log("memories");
  }, [data, isLoading]);

  const handleCheck = (beneficiary: IBeneficiary) => {
    if (values.includes(beneficiary.email)) return;
    setValues((prev) => [...prev, beneficiary.email]);
  };

  const handleAddStoriesToCapsule = () => {
    onAddRecipient(values);
    handleClose();
  };

  return (
    <div className="modal-container">
      <ModalCloseBtn onClick={handleClose} />
      <div className="space-y-6">
        <h4 className="modal-title">Select item from memory</h4>
        <small className="font-inter text-sm text-grey-600">
          Share an entry from memory as a time capsule
        </small>

        <div className="my-6">
          <div
            // onClick={() => open("search-memory")}
            className="wfit w-full! sm:w-full!"
          >
            <div className="w-10 h-10 flex cursor-pointer bg-white items-center justify-center rounded-lg border border-gray-200 sm:hidden">
              <SearchIcon />
            </div>
            <div className="hidden sm:block max-w[489px]">
              <Searchinput className="bg-white border-gray-200!" />
            </div>
          </div>
        </div>

        <ul className="space-y-4">
          {!isLoading && isEmpty(data?.data) ? (
            <span>You have no Memories</span>
          ) : (
            data?.data?.docs?.map((memory: IMemory, index: number) => (
              <li
                key={`${memory._id}-${index}`}
                className="flex itemscenter justifybetween borderb border-[#F2F4F7] py2 pb4 last:border0"
              >
                {/*<UserItem {...beneficiary} />
                <Checkbox
                  checked={values.includes(beneficiary.email)}
                  onChange={() => handleCheck(beneficiary)}
                />*/}

                <div className="">
                  <div></div>
                  <p>dddd</p>
                </div>
              </li>
            ))
          )}
        </ul>

        <div className="flex justify-end! gap-3">
          <button
            type="button"
            onClick={handleAddStoriesToCapsule}
            className="btn text-sm! text-sand-10! bg-transparent! border border-sand-2 shadow-none!"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleAddStoriesToCapsule}
            className="btn text-sm"
          >
            Add {2} stories to capsule
          </button>
        </div>
      </div>
    </div>
  );
}
