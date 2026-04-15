import { Checkbox } from "@/components/Form";
import type { IDropdownOption } from "./interface";

export function DefaultDropdownOption({ onClick, item }: IDropdownOption) {
  return (
    <li
      onClick={() => onClick(item.value)}
      className="flex cursor-pointer items-center gap-2.5 rounded px-2.5 py-1.5 text-text-neutral-weak hover:bg-fill-brand-weaker"
    >
      {item.startIcon}
      <span className="font-inter text-sm">{item.label}</span>
    </li>
  );
}

export function CheckboxOption({ onClick, item, value }: IDropdownOption) {
  return (
    <li
      onClick={() => onClick(item.value)}
      className="flex cursor-pointer items-center gap-2.5 px-1 py-2 text-text-neutral-weak"
    >
      <Checkbox
        label={item.label}
        value={item.value}
        checked={item.value === value}
        className="text-sm text-text-neutral-weak"
      />
    </li>
  );
}
