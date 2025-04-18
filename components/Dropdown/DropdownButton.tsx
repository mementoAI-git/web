"use client";

import ChevronDown from "@/public/icon/chevron-down.svg";
import React, { useState } from "react";
import { IDropdownButton } from "./interface";
import { DropdowmMenu } from "./DropdownMenu";
import useClickAway from "@/hooks/use-clickaway";

export function DropdownButton({ title, ...props }: IDropdownButton) {
  const [open, setOpen] = useState(false);
  const ref = useClickAway(() => setOpen(false));

  function handleSelect(value: string) {
    props.onSelect(value);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex h-full cursor-pointer items-center justify-center gap-1 rounded-lg border border-grey-500 bg-white px-3.5 py-2.5 font-inter text-sm font-medium text-grey-600 capitalize shadow-sm"
      >
        {title}
        <ChevronDown />
      </button>
      {open && <DropdowmMenu {...{ ...props, onSelect: handleSelect }} />}
    </div>
  );
}
