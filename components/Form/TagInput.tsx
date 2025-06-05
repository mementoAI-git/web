import { KeyboardEvent, useState } from "react";
import { ITexinput } from "./TextInput";
import { isEmpty } from "@/utility";
import TImesIcon from "@/public/icon/times.svg"

interface ITaginput extends ITexinput {
  values: string[];
  setValue: (v: string[]) => void;
}

export default function Taginput({ values, setValue, label, ...props }: ITaginput) {
  const [input, setInput] = useState("");

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = input.trim();

      if (!values.includes(tag)) {
        setValue([...values, tag]);
      }
      setInput("");
    }
  };

  const removeTag = (tag: string) => {
    setValue(values.filter((v) => v !== tag));
  };

  return (
    <div>
      <label className="input-label">{label}</label>
      <div className="input-base !h-fit !flex-wrap !justify-start">
        <div className="flex items-center gap-2">
          <div className="flex flex-wrap gap-2">
            {values.map((v, i) => (
              <span
                onClick={() => removeTag(v)}
                key={i}
                className="mem-tags flex gap-2 items-center !lowercase !bg-transparent !font-normal !text-grey-600"
              >
                <span className="block max-w-40 truncate whitespace-nowrap">
                  {v}
                </span>
                <TImesIcon width={7} />
              </span>
            ))}
          </div>
          <input
            placeholder={isEmpty(values) && props.placeholder}
            className="w-full flex-1 outline-0 placeholder:text-[#000D4D73]"
            onKeyDown={onKeyDown}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
      </div>
      {props?.error && <small className="text-xs text-danger">{props?.error}</small>}
    </div>
  );
}