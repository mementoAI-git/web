import { Checkbox } from "../Form";
import { IDropdownOption } from "./interface";

export function DefaultDropdownOption({ onClick, item }: IDropdownOption) {
  return (
    <li
      onClick={() => onClick(typeof item === "string" ? item : item.value)}
      className="flex cursor-pointer hover:bg-[#f5f5f5]/60 items-center gap-2.5 px-1 py-2 text-[#3C3F3E]"
    >
      {typeof item !== "string" && item?.startIcon}
      <span className="font-inter text-sm">
        {typeof item === "string" ? item : item.label}
      </span>
    </li>
  );
}

export function CheckboxOption({ onClick, item, value }: IDropdownOption) {
  return (
    <li
      onClick={() => onClick(item.value)}
      className="flex cursor-pointer items-center gap-2.5 px-1 py-2 text-[#3C3F3E]"
    >
      <Checkbox
        label={item.label}
        value={item.value}
        checked={item.value === value}
        className="text-sm text-[#3C3F3E]"
      />
    </li>
  );
}
