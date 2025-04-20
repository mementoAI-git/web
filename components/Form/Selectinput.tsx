"use client"
import { ChangeEvent, useMemo, useState } from "react"
import { ITexinput } from "./TextInput"
import ChevronDownIcon from "@/public/icon/chevron-down.svg"
import useClickAway from "@/hooks/use-clickaway"

interface IOption {
  label: string;
  value: string;
}

interface ISelect extends ITexinput {
  label: string;
  value?: string;
  data?: IOption[];
}

export function Selectinput({ label, onChange, data = [], ...props }: ISelect) {
  const [value, setValue] = useState(props.value);
  const [show, setShow] = useState(false);
  const ref = useClickAway(() => setShow(false));

  const valueLabelObj = useMemo(() => {
    return data.reduce((acc, item) => {
      acc[item.value] = item.label;
      return acc
    }, {} as Record<string, string>)
  }, [data])
  console.log(valueLabelObj)

  function handleOnSelect(value: string) {
    setValue(value);
    if (onChange) {
      const event = {
        target: { name: props.name, value },
      };

      onChange(event as ChangeEvent<HTMLInputElement>)
    }
  }
  return (
    <div
      ref={ref}
      className={`input-container group ${props.error && "error"}`}
    >
      <label className="input-label">{label}</label>
      <div onClick={() => setShow((p) => !p)}>
        <div className="input-base flex items-center justify-between">
          <input
            {...props}
            readOnly
            className="flex-1 outline-0 placeholder:text-[#000D4D73]"
          />
          <span className="text-[#000D4D73]">
            <ChevronDownIcon />
          </span>
        </div>
        {show && (
          <div className="mt-1 max-h-50 w-full overflow-x-hidden overflow-y-visible rounded-lg bg-white p-2 shadow-drop-down">
            {data.map((item, i) => (
              <div
                onClick={() => handleOnSelect(item.value)}
                key={i}
                className="flex w-full cursor-pointer items-center justify-between rounded bg-transparent px-1 py-2 hover:bg-[#0015800A]"
              >
                {item.label}
                {value === item.value && (
                  <div className="aspect-square w-2.5 rounded-full bg-primary outline-1 outline-offset-3 outline-primary" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {props.error && (
        <small className="text-xs text-danger">{props.error}</small>
      )}
    </div>
  );
}
