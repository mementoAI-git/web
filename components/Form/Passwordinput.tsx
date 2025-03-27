import { ITexinput } from "./TextInput";
import EyesoffIcon from "@/public/icon/eye-off.svg"

export function Passwordinput({ label = "Password", ...props }: ITexinput) {
  return (
    <div className="input-container">
      <label className="input-label">{label}</label>
      <div className="input-base flex items-center justify-between">
        <input type="password" placeholder=" • • • • • • •" {...props} className="flex-1 outline-0 placeholder:text-[#000D4D73]" />
        <EyesoffIcon />
      </div>
    </div>
  )
}