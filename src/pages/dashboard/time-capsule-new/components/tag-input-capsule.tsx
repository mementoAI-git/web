import { useState, type KeyboardEvent } from "react";
import type { ITexinput } from "./text-input";
import { TimesIcon } from "@/components/icons";
import { isEmpty } from "@/utility";

interface TaginputProps extends Omit<ITexinput, "value" | "onChange"> {
  values: string[];
  setValue: (values: string[]) => void;
}

export default function Taginput({
  values,
  setValue,
  label,
  placeholder,
  error,
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
    <div>
      {label && <label className="input-label">{label}</label>}
      <div className="input-base !h-fit !flex-wrap !justify-start gap-2 flex">
        {/* Tags rendered directly inside input-base container */}
        {values.map((value) => (
          <span
            key={value}
            onClick={() => removeTag(value)}
            className="mem-tags flex items-center gap-2 !lowercase !bg-transparent !font-normal !text-grey-600 cursor-pointer"
          >
            <span className="block max-w-40 truncate whitespace-nowrap">
              {value}
            </span>
            <TimesIcon width={7} height={7} />
          </span>
        ))}

        {/* Input field */}
        <input
          placeholder={isEmpty(values) ? placeholder : ""}
          className="flex-1 min-w-[120px] outline-0 placeholder:text-[#000D4D73]"
          onKeyDown={onKeyDown}
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
      </div>
      {error && <small className="text-xs text-danger">{error}</small>}
    </div>
  );
}
