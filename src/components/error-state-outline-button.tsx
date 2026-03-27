import type { ComponentProps } from "react";
import { ArrowLeftIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

/** Shared layout + v3 outline styles for full-width error / empty-state secondary actions. */
export const errorStateOutlineButtonClassName =
  "btn-outline-v3 h-fit gap-[4px]! py-3 sm:!py-4 md:!py-[14px] !px-6 sm:!px-8 md:!px-12 w-full sm:w-auto";

export function ErrorStateOutlineButton({
  className,
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(errorStateOutlineButtonClassName, className)}
      {...props}
    />
  );
}

export function ErrorStateGoBackButton({
  className,
  label = "Go back",
  ...props
}: Omit<ComponentProps<"button">, "children"> & { label?: string }) {
  return (
    <ErrorStateOutlineButton className={className} {...props}>
      <ArrowLeftIcon className="size-4 text-lg" />
      <span>{label}</span>
    </ErrorStateOutlineButton>
  );
}
