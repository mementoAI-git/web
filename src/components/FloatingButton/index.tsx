import type { ButtonHTMLAttributes } from "react";
import Spinner from "@/components/spinner";
import React from "react";
import { cn } from "@/utility";

interface IFloatingButton extends ButtonHTMLAttributes<HTMLButtonElement> {
  title?: string;
  children: React.ReactElement;
  loading?: boolean;
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
      className={cn("btn-outline rounded-lg! mt-2 h-12 w-full", className, {
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
