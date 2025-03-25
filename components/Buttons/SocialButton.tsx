import React, { ButtonHTMLAttributes } from "react"

interface IButton {
  title: string
  icon: React.ReactElement
  onClick?: (f: FormData) => void
}

export function SocialButton({ icon, title, onClick }: IButton) {
  return (
    <form action={onClick}>
      <button type="submit" className="flex cursor-pointer w-full max-h-11 border border-grey-100 px-4 py-[10px] rounded-lg bg-white gap-3 items-center justify-center shadow-sm">
        {icon}
        <span className="font-inter text-base font-medium">{title}</span>
      </button>
    </form>
  )
}