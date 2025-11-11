import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { SearchIcon } from "@/components/icons";
import { cn } from "@/utility";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  end?: ReactNode;
}

export const Searchinput = forwardRef<HTMLInputElement, SearchInputProps>(
  function Searchinput({ className = "", end = null, ...props }, ref) {
    return (
      <div
        className={cn(
          "flex h-full flex-1 items-center gap-2 rounded-lg border border-[rgba(208,213,221,1)] bg-white px-[14px] py-2",
          className,
        )}
      >
        <SearchIcon className="size-4 text-[#667085]" />
        <input
          ref={ref}
          className="flex-1 bg-transparent outline-none placeholder:text-[#98A2B3]"
          {...props}
        />
        {end}
      </div>
    );
  },
);
