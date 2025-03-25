import { ITexinput } from "./TextInput";
import EyesoffIcon from "@/public/icon/eye-off.svg"

export function Passwordinput({ label = "Password", ...props }: ITexinput) {
  return (
    <div className="flex gap-1.5 flex-col justify-start">
      <label className="font-inter text-secondary font-medium text-sm leading-5">{label}</label>
      <div className="flex items-center justify-between shadow-sm py-2 px-3 focus-within:border-primary focus-within:border-[1.5px] rounded-lg border border-grey-100 h-10">
        <input type="password" placeholder=" • • • • • • •" {...props} className="flex-1 outline-0" />
        <EyesoffIcon />
      </div>
    </div>
  )
}