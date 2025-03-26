"use client"
import { ITexinput } from "./TextInput"
import CalendarIcon from "@/public/icon/calendar.svg"
import { useState } from "react"

export function Dateinput({ label, onChange, ...props }: ITexinput) {
  const [show, setShow] = useState(false)

  const handleClose = (state: boolean) => {
    setShow(state)
  }
  return (
    <div className="flex gap-1.5 flex-col justify-start">
      <label className="font-inter text-secondary font-medium text-sm leading-5 capitalize">{label}</label>
      <div className="bg-white flex items-center justify-between shadow-sm py-2 px-3 focus-within:border-primary focus-within:border-[1.5px] rounded-lg border border-grey-100 h-10">
        <input type="password" placeholder="DD-MM-YYYY" {...props} className="flex-1 outline-0 placeholder:text-[#000D4D73]" />
        <CalendarIcon />
      </div>
    </div>
  )
}