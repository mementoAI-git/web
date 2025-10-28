"use client";

import Filter from "./Filter";
import { Searchinput } from "@/components/Form";
import { useModal } from "@/hooks/use-modal";
import PlusIcon from "@/public/icon/plus.svg"
import { cn } from "@/utility";

export default function Header({ count = 0 }) {
  const { push } = useModal()
  return (
    <div className="flex flex-col items-start justify-between gap-3 w-full">
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm text-[#050709] font-inter">Beneficiaries</span>
        <span className="block rounded-full bg-grey-500 shrink-0 px-3 py-0.5 font-inter text-xs text-grey-600">{count} people</span>
      </div>
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:max-h-10 gap-2 sm:gap-3 w-full">
        <div>
          <Searchinput className="!bg-white border-gray-300" />
        </div>
        {/* <Filter /> */}
        <button
          onClick={() => push("add-beneficiary")}
          className={cn("btn", "!rounded-lg !bg-gray-950 w-full sm:w-fit")}
        >
          <PlusIcon width={15} />
          <span className="font-inter text-sm font-semibold text-white">Add Beneficiary</span>
        </button>
      </div>
    </div >
  )
}