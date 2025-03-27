"use client"
import { ITexinput } from "./TextInput"
import CalendarIcon from "@/public/icon/calendar.svg"

export function Dateinput({ label, onChange, ...props }: ITexinput) {
  return (
    <div className="input-container">
      <label className="input-label">{label}</label>
      <div className="bg-white flex items-center justify-between shadow-sm py-2 px-3 focus-within:border-primary focus-within:border-[1.5px] rounded-lg border border-grey-100 h-10">
        <input type="password" placeholder="DD-MM-YYYY" {...props} className="flex-1 outline-0 placeholder:text-[#000D4D73]" />
        <CalendarIcon />
      </div>
    </div>
  )
}