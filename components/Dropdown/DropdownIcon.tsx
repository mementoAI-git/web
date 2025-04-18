"use client";

import React, { useState } from "react";
import { DropdowmMenu } from "./DropdownMenu";
import { IDropdownIcon } from "./interface";
import useClickAway from "@/hooks/use-clickaway";

export function DropdowmIcon({ icon, ...props }: IDropdownIcon) {
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
        className="aspect-square rounded-full p-2"
      >
        {icon}
      </button>
      {open && <DropdowmMenu {...{ ...props, onSelect: handleSelect }} />}
    </div>
  );
}
