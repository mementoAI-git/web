import type { ReactNode } from "react";
import { cn } from "@/utility";

type SettingsGeneralFieldCellProps = {
  label: string;
  placeholder: string;
  displayValue: string;
  valueEmphasis?: boolean;
  valueAdornment?: ReactNode;
  className?: string;
};

export function SettingsGeneralFieldCell({
  label,
  placeholder,
  displayValue,
  valueEmphasis = false,
  valueAdornment,
  className,
}: SettingsGeneralFieldCellProps) {
  const hasValue = displayValue.trim().length > 0;

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex flex-col gap-1">
        <span className="font-inter text-sm font-normal text-v3-text-weak">{label}</span>
        {hasValue ? (
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={cn(
                "min-w-0 break-words font-inter text-sm font-semibold",
                valueEmphasis ? "text-v3-fill-strong" : "text-v3-text-strong",
              )}
            >
              {displayValue}
            </span>
            {valueAdornment}
          </div>
        ) : (
          <span className="font-inter text-sm text-v3-text-weak">{placeholder}</span>
        )}
      </div>
    </div>
  );
}
