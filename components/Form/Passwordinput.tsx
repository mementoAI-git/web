"use client"

import { useState } from "react";
import { ITexinput } from "./TextInput";
import EyesoffIcon from "@/public/icon/eye-off.svg"
import EyeIcon from "@/public/icon/eye.svg"

export function Passwordinput({ label = "Password", ...props }: ITexinput) {
  const [show, setShow] = useState(false)
  return (
    <div className="input-container">
      <label className="input-label">{label}</label>
      <div className="input-base flex items-center justify-between">
        <input type={show ? "text" : "password"} placeholder=" • • • • • • •" {...props} className="flex-1 outline-0 placeholder:text-[#000D4D73]" />
        <div className="text-grey-300 cursor-pointer" onClick={() => setShow(p => !p)}>
          {
            show ?
              <EyesoffIcon width={16} /> :
              <EyeIcon width={20} />
          }
        </div>
      </div>
    </div>
  )
}