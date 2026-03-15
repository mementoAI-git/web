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
        "relative min-h-[48px] w-full rounded-xl border-[1.5px] bg-[#FFFCF8] p-4 text-left transition-[border-color,background] duration-150 ease-in-out",
        "hover:border-[#E8B99A] hover:bg-[#FFFCF8]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E26A24] focus-visible:ring-offset-2",
        isSelected && "border-[#2C1F15] bg-[#2C1F15] hover:border-[#E26A24] hover:bg-[#2C1F15]",
        disabled && "cursor-not-allowed opacity-50 border-[#E4D9CC] bg-[#FAF7F2] hover:border-[#E4D9CC] hover:bg-[#FAF7F2]"
      )}
    >
      {isSelected && (
        <span
          className="absolute right-2 top-2 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#E26A24] text-[10px] text-white"
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
          <span className={cn("block font-medium", isSelected ? "text-white" : "text-[#2C1F15]")}>{label}</span>
          {sublabel && (
            <span className={cn("mt-0.5 block text-sm", isSelected ? "text-white/80" : "text-[#7A6A5E]")}>{sublabel}</span>
          )}
        </div>
      </div>
    </button>
  );
}
