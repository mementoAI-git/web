"use client";

import { type ChangeEvent, type ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ITexinput } from "./text-input";

export interface Option {
  label: string;
  value: string;
}

export interface SelectInputProps extends Omit<ITexinput, "onChange"> {
  label: string | ReactNode;
  value?: string;
  data?: Option[];
  className?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function Selectinput({
  label,
  onChange,
  labelClassName = "",
  inputClassName = "",
  name,
  value,
  placeholder,
  data = [],
  error,
  disabled,
  className,
}: SelectInputProps) {
  const stringValue = value !== undefined && value !== null ? String(value) : undefined;

  const handleValueChange = (nextValue: string) => {
    if (onChange && name !== undefined) {
      const event = {
        target: { name, value: nextValue },
      } as ChangeEvent<HTMLInputElement>;
      onChange(event);
    }
  };

  return (
    <div
      className={cn(
        "input-container relative group",
        error && "error",
        className
      )}
    >
      {label && (
        <label className={cn("input-label", labelClassName)}>{label}</label>
      )}
      <Select
        value={stringValue}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn(
            "input-base flex h-auto min-h-9 w-full items-center justify-between rounded-lg border border-stroke-neutral-weak bg-transparent px-3 py-2 text-sm shadow-none ring-offset-0 focus:ring-1 focus:ring-ring data-placeholder:text-text-neutral-weaker",
            inputClassName
          )}
        >
          <SelectValue placeholder={placeholder ?? "Select..."} />
        </SelectTrigger>
        <SelectContent className="z-300 border-[rgba(208,213,221,1)]!">
          {data.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <small className="text-xs text-danger">{error}</small>
      )}
    </div>
  );
}
