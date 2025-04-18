import { InputHTMLAttributes } from "react";

export interface ITexinput extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
}

export function Textinput({ label, error = null, ...props }: ITexinput) {
  return (
    <div className={`input-container group ${error ? "error" : ""}`}>
      {label && <label className="input-label">{label}</label>}
      <input
        {...props}
        className={`input-base outline-0 group-[.error]:!border-red-600 placeholder:text-[#000D4D73] focus:border-[1.5px] focus:border-primary ${props.className}`}
      />
      {error && <small className="text-xs text-danger">{error}</small>}
    </div>
  );
}
