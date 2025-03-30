"use client"
import { useState } from "react"
import { ITexinput } from "./TextInput"
import ChevronDownIcon from "@/public/icon/chevron-down.svg"

interface IOption {
  label: string
  value: string
}

interface ISelect extends ITexinput {
  label: string
  data?: (string | IOption)[]
}

export function Selectinput({ label, onChange, data = [], ...props }: ISelect) {
  const [value, setValue] = useState(props.value || "")
  const [show, setShow] = useState(false)
  return (
    <div className="input-container">
      <label className="input-label">{label}</label>
      <div>
        <div className="input-base flex items-center justify-between">
          <input placeholder="DD-MM-YYYY" {...props} className="flex-1 outline-0 placeholder:text-[#000D4D73]" />
          <span className="text-[#000D4D73]">
            <ChevronDownIcon />
          </span>
        </div>
        {
          show &&
          <div className="w-full p-2 rounded-lg max-h-50 overflow-x-hidden overflow-y-visible bg-white shadow-drop-down mt-1">
            {
              data.map(f => (
                <div className="flex justify-between items-center rounded w-full py-2 px-1 bg-transparent hover:bg-[#0015800A]">
                  Nigeria
                  <div className="w-2.5 aspect-square bg-primary outline-1 outline-primary outline-offset-3 rounded-full" />
                </div>
              ))
            }
          </div>
        }
      </div>
    </div>
  )
}