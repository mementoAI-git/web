import * as React from "react";
import { cn } from "@/lib/utils";

export interface OnboardSelectionCardProps {
  value: string;
  label: string;
  icon?: string;
  isSelected: boolean;
  onClick: (value: string) => void;
  /** Grey "add" style: border 12%, bg 4% opacity */
  variant?: "default" | "add";
}

export function OnboardSelectionCard({
  value,
  label,
  icon,
  isSelected,
  onClick,
  variant = "default",
}: OnboardSelectionCardProps) {
  const isAddVariant = variant === "add";
  return (
    <button
      type="button"
      role="button"
      aria-pressed={isSelected}
      onClick={() => onClick(value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(value);
        }
      }}
      className={cn(
        "flex min-h-10 max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-2 text-left transition-colors duration-150 ease-out active:scale-[0.98] sm:min-h-8 sm:w-fit sm:gap-1 sm:px-2 sm:py-1",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-brand-strong focus-visible:ring-offset-2",
        isAddVariant
          ? "border-v3-stroke-weak bg-v3-fill-weaker text-v3-text-weak hover:border-v3-stroke-strong hover:bg-v3-fill-weak"
          : isSelected
            ? "border-v3-brand-strong/30 bg-v3-brand-strong/[0.08] text-v3-text-strong"
            : "border-v3-stroke-weak bg-v3-fill-weaker text-v3-text-weak hover:border-v3-stroke-strong hover:bg-v3-fill-weak"
      )}
    >
      {icon && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-base sm:h-6 sm:w-6 sm:text-xl">
          {icon}
        </span>
      )}
      <span className="break-words font-medium leading-tight text-[12px] text-v3-text-strong">{label}</span>
    </button>
  );
}
