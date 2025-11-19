import type { ComponentType, SVGProps } from "react";
import { TerminalIcon } from "@/components/icons";
import { cn } from "@/utility";

interface InterestChipProps {
  title?: string;
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function InterestChip({
  title,
  Icon = TerminalIcon,
  isSelected,
  onClick,
  className = "",
}: InterestChipProps) {
  return (
    <li
      onClick={onClick}
      className={cn(
        "flex w-fit cursor-pointer items-center gap-2 sm:gap-3 rounded-lg border border-gray-200 py-2 sm:py-2.5 px-3 sm:px-4 transition-colors duration-200 hover:border-gray-300 active:scale-95",
        className,
        {
          "!border-blue-4 bg-blue-1": isSelected,
        },
      )}
    >
      <div className="flex size-4 sm:size-5 items-center justify-center text-gray-500 shrink-0">
        <Icon className="w-3.5 h-3.5 sm:w-[15px] sm:h-[15px]" />
      </div>
      <span className="text-sm sm:text-base font-inter text-gray-950/90 whitespace-nowrap">{title}</span>
    </li>
  );
}

