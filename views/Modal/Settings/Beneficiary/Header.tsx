"use client";

import Filter from "./Filter";
import { Searchinput } from "@/components/Form";
import { useModal } from "@/hooks/use-modal";
import PlusIcon from "@/public/icon/plus.svg"
import { cn } from "@/utility";

export default function Header({ count = 0 }) {
  const { open } = useModal()
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 w-full">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-base sm:text-lg text-secondary font-inter">Beneficiaries</span>
        <span className="block rounded-full bg-grey-500 shrink-0 px-3 py-0.5 font-inter text-xs text-grey-600">{count} people</span>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch lg:max-h-10 gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
        <Searchinput />
        {/* <Filter /> */}
        <button
          onClick={() => open("add-beneficiary")}
          className={cn("btn", "!rounded-lg w-full sm:w-fit")}
        >
          <PlusIcon width={15} />
          <span>Add Beneficiary</span>
        </button>
      </div>
    </div>
  )
}