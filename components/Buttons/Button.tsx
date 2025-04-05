import { ButtonHTMLAttributes } from "react"
import Spinner from "../Spinner"

interface IButton extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string
  className?: string
  loading?: boolean
}
export function Button({ title, className, loading = false }: IButton) {
  return (
    <button className={`bg-secondary  disabled:bg-grey-100 disabled:cursor-not-allowed cursor-pointer mt-2 h-12 w-full rounded-lg flex items-center gap-3 justify-center shadow-btn ${className}`}>
      <span className="text-white font-bold leading-6 text-center font-inter text-base">{title}</span>
      {loading && <Spinner />}
    </button>
  )
}