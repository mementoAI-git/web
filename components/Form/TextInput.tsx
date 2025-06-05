import { InputHTMLAttributes, ReactNode } from "react";

export interface ITexinput extends InputHTMLAttributes<HTMLInputElement> {
  label?: string | ReactNode;
  error?: string | null;
  end?: ReactNode
  labelClassName?: string
  inputClassName?: string
}

export function Textinput({ label, end, labelClassName = "", inputClassName = "", error = null, ...props }: ITexinput) {
  return (
    <div className={`input-container group ${error ? "error" : ""}`}>
      {label && <label className={`input-label ${labelClassName}`}>{label}</label>}
      <div className={`input-base flex items-center justify-between ${inputClassName}`}>
        <input
          {...props}
          className="flex-1 outline-0 placeholder:text-[#000D4D73]"
        />
        {end && <div>{end}</div>}
      </div>
      {error && <small className="text-xs text-danger">{error}</small>}
    </div>
  );
}
