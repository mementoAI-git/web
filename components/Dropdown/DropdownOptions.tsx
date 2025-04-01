import { Checkbox } from "../Form";
import { IDropdownOption } from "./interface";

export function DefaultDropdownOption({ onClick, item }: IDropdownOption) {
  return (
    <li
      onClick={() => onClick(typeof item === "string" ? item : item.value)}
      className="cursor-pointer flex items-center py-2 px-1 gap-2.5 text-[#3C3F3E]"
    >
      {typeof item !== "string" && item?.startIcon}
      <span className="font-inter text-sm">{typeof item === "string" ? item : item.label}</span>
    </li>
  )
}

export function CheckboxOption({ onClick, item }: IDropdownOption) {
  return (
    <li
      onClick={() => onClick(item.value)}
      className="cursor-pointer flex items-center py-2 px-1 gap-2.5 text-[#3C3F3E]"
    >
      <Checkbox label={item.label} value={item.value} className="text-[#3C3F3E] text-sm" />
    </li>
  )
}