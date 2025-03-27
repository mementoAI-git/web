import { ButtonHTMLAttributes } from "react"

interface IButton extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string
  className?: string
}
export function Button({ title, className }: IButton) {
  return (
    <button className={`bg-secondary disabled:bg-grey-100 disabled:cursor-not-allowed cursor-pointer mt-2 h-12 w-full rounded-lg flex items-center justify-center shadow-btn ${className}`}>
      <span className="text-white font-bold leading-6 text-center font-inter text-base">{title}</span>
    </button>
  )
}