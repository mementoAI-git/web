import { ButtonHTMLAttributes } from "react"
import Spinner from "../Spinner"
import Link from "next/link"

interface IButton extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string
  className?: string
  loading?: boolean
  href?: string | null
}
export function Button({ title, className, href = null, loading = false, ...props }: IButton) {
  if (href) {
    return (
      <Link href={href} className={`bg-secondary cursor-pointer mt-2 h-12 w-full rounded-lg flex items-center gap-3 justify-center shadow-btn ${className}`}>
        <span className="text-white font-bold leading-6 text-center font-inter text-base">{title}</span>
      </Link>
    )
  }
  return (
    <button {...props} disabled={loading} className={`bg-secondary ${props.disabled && "bg-grey-100"}  disabled:cursor-not-allowed cursor-pointer mt-2 h-12 w-full rounded-lg flex items-center gap-3 justify-center shadow-btn ${className}`}>
      <span className="text-white font-bold leading-6 text-center font-inter text-base">{title}</span>
      <Spinner loading={loading} className="!size-4" />
    </button>
  )
}