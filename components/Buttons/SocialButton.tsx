import React, { ButtonHTMLAttributes } from "react"

interface IButton extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string
  icon: React.ReactElement
}

export function SocialButton({ icon, title, ...props }: IButton) {
  return (
    <button {...props} className="flex cursor-pointer disabled:opacity-65 w-full max-h-11 border border-grey-100 px-4 py-[10px] rounded-lg bg-white gap-3 items-center justify-center shadow-sm">
      {icon}
      <span className="font-inter text-base font-medium">{title}</span>
    </button>
  )
}