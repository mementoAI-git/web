import { useState } from "react";
import chevronDownIcon from "@/assets/icon/chevron-down.svg?url";
import useClickAway from "@/hooks/use-clickaway";
import type { IDropdownButton } from "./interface";
import { DropdowmMenu } from "./DropdownMenu";

export function DropdownButton({ title, value, ...props }: IDropdownButton & { value?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useClickAway<HTMLDivElement>(() => setOpen(false));

  function handleSelect(selectedValue: string) {
    props.onSelect(selectedValue);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-full shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg border border-grey-500 bg-white px-3.5 py-2.5 font-inter text-sm font-medium capitalize text-grey-600 shadow-sm"
      >
        {title}
        <img src={chevronDownIcon} alt="Toggle dropdown" className="size-4" />
      </button>
      {open && <DropdowmMenu {...{ ...props, onSelect: handleSelect, value }} />}
    </div>
  );
}
