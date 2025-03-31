"use client"

import ChevronDown from "@/public/icon/chevron-down.svg"
import React, { useEffect, useRef, useState } from "react"
import { IDropdown } from "./interface";
import DropdowmMenu from "./DropdownMenu";

export default function Dropdown({ title, onSelect, items = [], ItemLayout }: IDropdown) {
  const [open, setOpen] = useState(false)
  const ref = useRef<any>(null)

  function handleSelect(value: string) {
    onSelect(value)
    setOpen(false)
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      setOpen(false)
    }
  }

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className="bg-white cursor-pointer flex justify-center h-full items-center capitalize font-inter font-medium text-sm py-2.5 px-3.5 gap-1 rounded-lg border border-grey-500 shadow-sm text-grey-600"
      >
        {title}
        <ChevronDown />
      </button>
      {
        open &&
        <DropdowmMenu
          items={items}
          ItemLayout={ItemLayout}
          onSelect={handleSelect}
        />
      }
    </div>
  )
}