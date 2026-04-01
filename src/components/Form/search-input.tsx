import type { InputHTMLAttributes, ReactNode } from "react";
import { SearchIcon } from "@/components/icons";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  className?: string;
  end?: ReactNode;
}

export function Searchinput({ className = "", end = null, ...props }: SearchInputProps) {
  return (
    <InputGroup
      className={cn(
        "h-full min-h-10 flex-1 rounded-lg border border-[rgba(208,213,221,1)] bg-white shadow-sm",
        className,
      )}
    >
      <InputGroupAddon align="inline-start" className="pl-3.5 text-text-neutral-weaker">
        <SearchIcon width={15} color="currentColor" />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search" {...props} />
      {end ? (
        <InputGroupAddon align="inline-end" className="pr-3.5">
          {end}
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}
