import { ITexinput } from "./TextInput";
import CheckIcon from "@/public/icon/check.svg"

export function Checkbox({ label, className, ...props }: ITexinput) {
  return (
    <div className={`flex items-center gap-2 font-inter ${className}`}>
      <input className="hidden peer" type="checkbox" {...props} />
      <span className="w-4 flex items-center justify-center peer-checked:bg-[#7F56D9] peer-checked:border-0 aspect-square cursor-pointer border border-[#D0D5DD] rounded-sm transition">
        <CheckIcon width={10} height={8} />
      </span>
      {label && <span className="text-inherit">{label}</span>}
    </div>
  )
}