import { useState, type KeyboardEvent, type ReactNode } from "react";
import type { ITexinput } from "./text-input";
import { TimesIcon } from "@/components/icons";
import { isEmpty, cn } from "@/utility";

interface TaginputProps extends Omit<ITexinput, "value" | "onChange"> {
  values: string[];
  setValue: (values: string[]) => void;
  className?: string;
  inputClassName?: string;
  children?: ReactNode;
}

export default function Taginput({
  values,
  setValue,
  label,
  placeholder,
  error,
  className,
  inputClassName,
  children,
}: TaginputProps) {
  const [input, setInput] = useState("");

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      const tag = input.trim();
      if (!tag || values.includes(tag)) {
        return;
      }
      setValue([...values, tag]);
      setInput("");
    }
  };

  const removeTag = (tag: string) => {
    setValue(values.filter((value) => value !== tag));
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <label className="input-label flex justify-start items-start h-6">{label}</label>}
      <div className={cn("input-base !h-fit !flex-wrap !justify-start", inputClassName)}>
        <div className="flex items-center gap-2">
          <div className="flex flex-wrap gap-2">
            {values.map((value) => (
              <span
                key={value}
                onClick={() => removeTag(value)}
                className="mem-tags flex items-center gap-2 !lowercase !bg-transparent !font-normal !text-text-neutral-weak"
              >
                <span className="block max-w-40 truncate whitespace-nowrap">
                  {value}
                </span>
                <TimesIcon width={7} height={7} />
              </span>
            ))}
          </div>
          <input
            placeholder={isEmpty(values) ? placeholder : ""}
            className="flex-1 outline-0 text-sm text-text-neutral-weak placeholder:text-text-neutral-weaker"
            onKeyDown={onKeyDown}
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
        </div>
      </div>
      {children}
      {error && <small className="text-xs text-danger">{error}</small>}
    </div>
  );
}
