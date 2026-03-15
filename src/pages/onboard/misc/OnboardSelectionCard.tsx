import * as React from "react";
import { cn } from "@/lib/utils";

export interface OnboardSelectionCardProps {
  value: string;
  label: string;
  icon?: string;
  isSelected: boolean;
  onClick: (value: string) => void;
}

export function OnboardSelectionCard({
  value,
  label,
  icon,
  isSelected,
  onClick,
}: OnboardSelectionCardProps) {
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
        "flex w-fit h-fit items-center gap-2 rounded-lg border p-2 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A90E2] focus-visible:ring-offset-2",
        isSelected
          ? "border-[#4A90E2] bg-[#4A90E2] text-white"
          : "border-gray-200 bg-white text-[#4A4A4A] hover:border-gray-300"
      )}
    >
      {icon && (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center text-xl">
          {icon}
        </span>
      )}
      <span className="font-medium">{label}</span>
    </button>
  );
}
