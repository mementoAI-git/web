import { cn } from "@/utility";
import { isEmpty } from "lodash";
import { InputHTMLAttributes, ReactNode } from "react";

export interface ITexinput extends InputHTMLAttributes<HTMLInputElement> {
  label?: string | ReactNode;
  error?: string | null;
  end?: ReactNode
  labelClassName?: string
  inputClassName?: string
}

export function Textinput({
  label,
  end,
  required = false,
  labelClassName = "",
  inputClassName = "",
  className = "",
  error = null,
  ...props
}: ITexinput) {
  return (
    <div className={`input-container group ${error ? "error" : ""}`}>
      {
        label &&
        <label className={cn("input-label ${labelClassName}", { [labelClassName]: isEmpty(labelClassName) })}>
          {label}{required && <span className="text-orange">*</span>}
        </label>
      }
      <div className={`input-base flex items-center justify-between ${inputClassName}`}>
        <input
          {...props}
          required={required}
          className={cn("flex-1 outline-0 placeholder:text-[#000D4D73]", { [className]: !isEmpty(className) })}
        />
        {end && <div className="shrink-0">{end}</div>}
      </div>
      {error && <small className="text-xs text-danger">{error}</small>}
    </div>
  );
}
