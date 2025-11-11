import { ITexinput } from "./TextInput";
import CheckIcon from "@/assets/icon/check.svg";

export function Checkbox({ label, className, ...props }: ITexinput) {
  return (
    <label
      className={`flex shrink-0 items-center gap-2 font-inter ${className}`}
    >
      <input className="peer hidden" type="checkbox" {...props} />
      <span className="flex aspect-square w-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-[#D0D5DD] text-transparent transition peer-checked:border-0 peer-checked:bg-blue-6 peer-checked:text-white">
        <CheckIcon width={10} height={8} />
      </span>
      {label && <span className="text-inherit">{label}</span>}
    </label>
  );
}
