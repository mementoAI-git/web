import { InputHTMLAttributes } from "react"

export interface ITexinput extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function Textinput({ label, ...props }: ITexinput) {
  return (
    <div className="flex gap-1.5 flex-col justify-start">
      <label className="font-inter text-secondary font-medium text-sm leading-5 capitalize">{label}</label>
      <input {...props} className="shadow-sm bg-white focus:shadow-none py-2 px-3 outline-0 focus:border-primary focus:border-[1.5px] rounded-lg border border-grey-100 h-10" />
    </div>
  )
}