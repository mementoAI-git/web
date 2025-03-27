import { InputHTMLAttributes } from "react"

export interface ITexinput extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function Textinput({ label, ...props }: ITexinput) {
  return (
    <div className="input-container">
      <label className="input-label">{label}</label>
      <input {...props} className={`input-base outline-0 placeholder:text-[#000D4D73] focus:border-primary focus:border-[1.5px] ${props.className}`} />
    </div>
  )
}