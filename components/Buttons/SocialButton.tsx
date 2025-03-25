import React from "react"

interface IButton {
  title: string
  icon: React.ReactElement
}

export function SocialButton({ icon, title }: IButton) {
  return (
    <button className="flex cursor-pointer w-full max-h-11 border border-grey-100 px-4 py-[10px] rounded-lg bg-white gap-3 items-center justify-center shadow-sm">
      {icon}
      <span className="font-inter text-base font-medium">{title}</span>
    </button>
  )
}