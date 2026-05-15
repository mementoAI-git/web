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
        "flex min-h-8 w-fit items-center gap-1 rounded-lg border py-1 px-2 text-left transition-colors duration-150 ease-out active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-brand-strong focus-visible:ring-offset-2",
        isAddVariant
          ? "border-v3-stroke-weak bg-v3-fill-weaker text-v3-text-weak hover:border-v3-stroke-strong hover:bg-v3-fill-weak"
          : isSelected
            ? "border-v3-brand-strong/30 bg-v3-brand-strong/[0.08] text-v3-text-strong"
            : "border-v3-stroke-weak bg-v3-fill-weaker text-v3-text-weak hover:border-v3-stroke-strong hover:bg-v3-fill-weak"
      )}
    >
      {icon && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center text-xl">
          {icon}
        </span>
      )}
      <span className="font-medium text-[12px] text-v3-text-strong">{label}</span>
    </button>
  );
}
