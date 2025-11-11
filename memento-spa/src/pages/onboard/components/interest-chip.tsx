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
        "flex w-fit cursor-pointer items-center gap-3 rounded-lg border border-gray-200 py-2.5 px-4",
        className,
        {
          "!border-blue-4 bg-blue-1": isSelected,
        },
      )}
    >
      <div className="flex size-5 items-center justify-center text-gray-500">
        <Icon width={15} height={15} />
      </div>
      <span className="text-base font-inter text-gray-950/90">{title}</span>
    </li>
  );
}

