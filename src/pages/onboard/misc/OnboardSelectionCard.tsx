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
        "flex min-h-8 w-fit items-center gap-1 rounded-lg border py-1 px-2 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E26A24] focus-visible:ring-offset-2",
        isAddVariant
          ? "border-black/[0.12] bg-black/[0.04] text-[#4A4A4A] hover:border-black/[0.18] hover:bg-black/[0.06]"
          : isSelected
            ? "border-[#E26A24]/20 bg-[#E26A24]/[0.06] text-[#4A4A4A]"
            : "border-gray-200 bg-white text-[#4A4A4A] hover:border-gray-300"
      )}
    >
      {icon && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center text-xl">
          {icon}
        </span>
      )}
      <span className="font-medium text-[12px]">{label}</span>
    </button>
  );
}
