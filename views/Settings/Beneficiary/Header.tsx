"use client";

import Filter from "./Filter";
import { Searchinput } from "@/components/Form";
import PlusIcon from "@/public/icon/plus.svg"

export default function Header() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-lg text-secondary font-inter">Beneficiaries</span>
        <span className="block rounded-full bg-grey-500 px-3 py-0.5 font-inter text-xs text-grey-600">5 people</span>
      </div>
      <div className="flex items-stretch max-h-10 gap-3">
        <Searchinput />
        <Filter />
        <button className="flex items-center justify-center gap-1 bg-secondary rounded-lg w-46 text-white">
          <PlusIcon width={15} />
          <span>Add Beneficiary</span>
        </button>
      </div>
    </div>
  )
}