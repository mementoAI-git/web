import SearchIcon from "@/public/icon/dashboard/search.svg";
import { ReactNode } from "react";
import { cn } from "@/utility";

export function Searchinput({ className = "", end = null }: { className?: string, end?: ReactNode }) {
  return (
    <div
      className={cn("flex h-full flex-1 items-center gap-2 rounded-lg border border-[rgba(208,213,221,1)] px-[14px] py-2", className)}>
      <SearchIcon />
      <input
        placeholder="Search"
        className="flex-1 outline-0"
      />
      {end}
    </div>
  );
}
