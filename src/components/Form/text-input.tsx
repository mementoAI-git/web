"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface ITexinput extends InputHTMLAttributes<HTMLInputElement> {
  label?: string | ReactNode;
  error?: string | null;
  end?: ReactNode;
  labelClassName?: string;
  inputClassName?: string;
}

export function Textinput({
  label,
  end,
  required = false,
  labelClassName = "",
  inputClassName = "",
  className = "",
  error = null,
  id: idProp,
  ...props
}: ITexinput) {
  const autoId = useId();
  const inputId = idProp ?? `field-${autoId}`;
  const invalid = Boolean(error);

  const inputClass = cn(
    "min-h-0 flex-1 border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0 md:text-sm",
    className,
  );

  const shell = (
    <div
      className={cn(
        "input-base flex min-h-[44px] items-center justify-between gap-2",
        inputClassName,
      )}
    >
      <Input
        id={inputId}
        required={required}
        aria-invalid={invalid || undefined}
        className={inputClass}
        {...props}
      />
      {end ? <div className="shrink-0">{end}</div> : null}
    </div>
  );

  return (
    <div
      className={cn("input-container group", {
        error: Boolean(error),
      })}
    >
      {label ? (
        typeof label === "string" ? (
          <Label htmlFor={inputId} className={cn("input-label", labelClassName)}>
            {label}
            {required ? <span className="text-orange">*</span> : null}
          </Label>
        ) : (
          <div className={cn("input-label", labelClassName)}>{label}</div>
        )
      ) : null}
      {shell}
      {error ? <small className="text-xs text-danger">{error}</small> : null}
    </div>
  );
}
