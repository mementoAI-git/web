import TerminalIcon from "@/public/icon/terminal.svg";
import { cn } from "@/utility";

interface IIntrestChip {
  title?: string;
  Icon?: React.ComponentType<{ width?: number; strokeWidth?: number }>;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function IntrestChip({ title, Icon, isSelected, onClick, className = "" }: IIntrestChip) {
  return (
    <li
      onClick={onClick}
      className={cn("border cursor-pointer border-gray-200 flex gap-3 w-fit items-center rounded-lg py-2.5 px-4", className, {
        "bg-blue-1 border-blue-4": isSelected
      })}
    >
      <div className="size-5 flex items-center justify-center text-gray-500" >
        {Icon ? <Icon width={15} strokeWidth={2} /> : null}
      </div>
      <span className="text-gray-950/90 text-base font-inter">{title}</span>
    </li>
  )
}
