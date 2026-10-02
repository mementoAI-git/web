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
        "flex w-fit cursor-pointer items-center gap-2 sm:gap-3 rounded-lg border border-stroke-neutral-weak py-2 sm:py-2.5 px-3 sm:px-4 transition-colors duration-200 hover:border-stroke-neutral-strong active:scale-95",
        className,
        {
          "!border-stroke-brand-strong bg-fill-brand-weak": isSelected,
        },
      )}
    >
      <div className="flex size-4 sm:size-5 items-center justify-center text-icon-neutral-weak shrink-0">
        <Icon className="w-3.5 h-3.5 sm:w-[15px] sm:h-[15px]" />
      </div>
      <span className="text-sm sm:text-base font-inter text-text-neutral-strong whitespace-nowrap">{title}</span>
    </li>
  );
}
