import ChevronDown from "@/public/icon/chevron-down.svg"
import React from "react"

interface IDropdown {
  title: React.ReactElement | string
}
export default function Dropdown({ title }: IDropdown) {
  return (
    <div>
      <button className="bg-white cursor-pointer flex justify-center h-full items-center capitalize font-inter font-medium text-sm py-2.5 px-3.5 gap-1 rounded-lg border border-grey-500 shadow-sm text-grey-600">
        {title}
        <ChevronDown />
      </button>
    </div>
  )
}