"use client";

import Filter from "./Filter";
import { Searchinput } from "@/components/Form";
import { useModal } from "@/hooks/use-modal";
import PlusIcon from "@/public/icon/plus.svg"
import { cn } from "@/utility";

export default function Header({ count = 0 }) {
  const { open } = useModal()
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-lg text-secondary font-inter">Beneficiaries</span>
        <span className="block rounded-full bg-grey-500 shrink-0 px-3 py-0.5 font-inter text-xs text-grey-600">{count} people</span>
      </div>
      <div className="flex items-stretch max-h-10 gap-3">
        <Searchinput />
        {/* <Filter /> */}
        <button
          onClick={() => open("add-beneficiary")}
          className={cn("btn", "!rounded-lg w-fit")}
        >
          <PlusIcon width={15} />
          <span>Add Beneficiary</span>
        </button>
      </div>
    </div>
  )
}