import { ButtonHTMLAttributes } from "react";
import Spinner from "../Spinner";
import Link from "next/link";
import { cn } from "@/utility";

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
        className={cn("btn", "!rounded-lg mt-2 h-12 w-full", className, { "bg-grey-100": props.disabled })}
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
      className={cn("btn", "!rounded-lg mt-2 h-12 w-full", className, { "bg-grey-100": props.disabled })}
    >
      <span className="text-center font-inter text-base leading-6 font-bold text-white">
        {title}
      </span>
      <Spinner loading={loading} className="!size-4" />
    </button>
  );
}
