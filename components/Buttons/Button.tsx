import { ButtonHTMLAttributes } from "react";
import Spinner from "../Spinner";
import Link from "next/link";

interface IButton extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  className?: string;
  loading?: boolean;
  href?: string | null;
}
export function Button({
  title,
  className,
  href = null,
  loading = false,
  ...props
}: IButton) {
  if (href) {
    return (
      <Link
        href={href}
        className={`mt-2 flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-secondary shadow-btn ${className}`}
      >
        <span className="text-center font-inter text-base leading-6 font-bold text-white">
          {title}
        </span>
      </Link>
    );
  }
  return (
    <button
      {...props}
      disabled={loading}
      className={`bg-secondary ${props.disabled && "bg-grey-100"} mt-2 flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-lg shadow-btn disabled:cursor-not-allowed ${className}`}
    >
      <span className="text-center font-inter text-base leading-6 font-bold text-white">
        {title}
      </span>
      <Spinner loading={loading} className="!size-4" />
    </button>
  );
}
