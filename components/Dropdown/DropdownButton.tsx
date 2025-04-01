"use client"

import ChevronDown from "@/public/icon/chevron-down.svg"
import React, { useState } from "react"
import { IDropdownButton } from "./interface";
import { DropdowmMenu } from "./DropdownMenu";
import useClickAway from "@/hooks/use-clickaway";

export function DropdownButton({ title, ...props }: IDropdownButton) {
  const [open, setOpen] = useState(false)
  const ref = useClickAway(() => setOpen(false))

  function handleSelect(value: string) {
    props.onSelect(value)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className="bg-white cursor-pointer flex justify-center h-full items-center capitalize font-inter font-medium text-sm py-2.5 px-3.5 gap-1 rounded-lg border border-grey-500 shadow-sm text-grey-600"
      >
        {title}
        <ChevronDown />
      </button>
      {open && <DropdowmMenu {...{ ...props, onSelect: handleSelect }} />}
    </div>
  )
}