import TerminalIcon from "@/public/icon/terminal.svg";
import { cn } from "@/utility";

interface IIntrestChip {
  title?: string;
  icon?: React.ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function IntrestChip({ title, icon, isSelected, onClick }: IIntrestChip) {
  return (
    <li
      onClick={onClick}
      className={cn("border cursor-pointer border-gray-200 flex gap-3 w-fit items-center rounded-lg py-2.5 px-4", {
        "bg-blue-1 border-blue-6": isSelected
      })}
    >
      <div className="size-5 flex items-center justify-center text-gray-500" >
        {icon || <TerminalIcon width={14} height={12} strokeWidth={2} />}
      </div>
      <span className="text-gray-950/90 text-base font-inter">{title}</span>
    </li>
  )
}