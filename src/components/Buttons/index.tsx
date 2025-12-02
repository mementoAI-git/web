import { Link } from "react-router-dom";
import type { ButtonHTMLAttributes } from "react";
import Spinner from "@/components/spinner";
import { cn } from "@/utility";

interface IButton extends ButtonHTMLAttributes<HTMLButtonElement> {
  title?: string;
  className?: string;
  loading?: boolean;
  href?: string | null;
}

export function Button({
  title,
  children,
  className,
  href = null,
  loading = false,
  ...props
}: IButton) {
  if (href) {
    return (
      <Link
        to={href}
        className={cn("btn !rounded-lg mt-2 h-12 w-full", className, {
          "bg-grey-100": props.disabled,
        })}
      >
        <span className="text-center font-inter text-base font-bold leading-6 text-white">
          {title}
        </span>
      </Link>
    );
  }
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={cn("btn rounded-lg! mt-2 h-12 w-full", className, {
        "bg-grey-100": props.disabled,
      })}
    >
      <span className="text-center font-inter text-base font-bold leading-6 text-white">
        {title || children}
      </span>
      <Spinner loading={loading} className="!size-4" />
    </button>
  );
}

interface IFloatingButton extends IButton {
  title?: string;
  children: React.ReactElement;
}
export function FloatingButton({
  children,
  className,
  loading = false,
  ...props
}: IFloatingButton) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={cn("btn rounded-lg! mt-2 h-12 w-full", className, {
        "bg-grey-100": props.disabled,
      })}
    >
      <span className="text-center font-inter text-base font-bold leading-6 text-white">
        {children}
      </span>
      <Spinner loading={loading} className="size-4!" />
    </button>
  );
}
