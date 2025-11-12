import { type InputHTMLAttributes, type ReactNode } from "react";
import { SearchIcon } from "@/components/icons";
import { cn } from "@/utility";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  end?: ReactNode;
}

export function Searchinput({ className = "", end = null }: SearchInputProps) {
  return (
    <div
      className={cn("flex h-full flex-1 items-center gap-2 rounded-lg border border-[rgba(208,213,221,1)] px-[14px] py-2", className)}>
      <SearchIcon width={15} color="#98A2B3" />
      <input
        placeholder="Search"
        className="flex-1 outline-0"
      />
      {end}
    </div>
  );
}
