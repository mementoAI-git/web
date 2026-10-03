import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectionCardProps {
  value: string;
  label: string;
  sublabel?: string;
  icon: string;
  isSelected: boolean;
  onClick: (value: string) => void;
  disabled?: boolean;
}

export function SelectionCard({
  value,
  label,
  sublabel,
  icon,
  isSelected,
  onClick,
  disabled = false,
}: SelectionCardProps) {
  const handleClick = () => {
    if (!disabled) onClick(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(value);
    }
  };

  return (
    <button
      type="button"
      role="button"
      aria-pressed={isSelected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={cn(
        "relative min-h-[48px] w-full rounded-xl border-[1.5px] bg-v3-fill-weaker p-4 text-left transition-[border-color,background] duration-150 ease-in-out",
        "hover:border-v3-stroke-strong hover:bg-v3-fill-weaker",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-brand-strong focus-visible:ring-offset-2",
        isSelected && "border-v3-text-strong bg-v3-text-strong hover:border-v3-brand-strong hover:bg-v3-text-strong",
        disabled && "cursor-not-allowed opacity-50 border-v3-stroke-weak bg-v3-fill-weaker hover:border-v3-stroke-weak hover:bg-v3-fill-weaker"
      )}
    >
      {isSelected && (
        <span
          className="absolute right-2 top-2 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-v3-brand-strong text-[10px] text-text-inverse-strong"
          aria-hidden
        >
          ✓
        </span>
      )}
      <div className="flex flex-row items-center gap-4">
        <span className="shrink-0 text-2xl" aria-hidden>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <span className={cn("block font-medium", isSelected ? "text-text-inverse-strong" : "text-v3-text-strong")}>{label}</span>
          {sublabel && (
            <span className={cn("mt-0.5 block text-sm", isSelected ? "text-text-inverse-weak" : "text-v3-text-weak")}>{sublabel}</span>
          )}
        </div>
      </div>
    </button>
  );
}
