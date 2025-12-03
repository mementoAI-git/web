"use client";

import {
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
  useEffect,
} from "react";
import { ChevronDownIcon } from "@/components/icons";
import useClickAway from "@/hooks/use-clickaway";
import type { ITexinput } from "./text-input";

interface Option {
  label: string;
  value: string;
}

interface SelectProps extends ITexinput {
  label: string | ReactNode;
  value?: string;
  data?: Option[];
  className?: string;
}

export function Selectinput({
  label,
  onChange,
  labelClassName = "",
  data = [],
  ...props
}: SelectProps) {
  const [value, setValue] = useState(props.value);
  const [show, setShow] = useState(false);
  const ref = useClickAway(() => setShow(false));

  useEffect(() => {
    setValue(props.value);
  }, [props.value]);

  const valueLabelMap = useMemo(() => {
    return data.reduce<Record<string, string>>((acc, item) => {
      acc[item.value] = item.label;
      return acc;
    }, {});
  }, [data]);

  const handleSelect = (nextValue: string) => {
    setValue(nextValue);
    if (onChange) {
      const event = {
        target: { name: props.name, value: nextValue },
      } as ChangeEvent<HTMLInputElement>;
      onChange(event);
    }
    setShow(false);
  };

  return (
    <div
      ref={ref}
      className={`input-container relative group ${props.error ? "error" : ""} ${props.className}`}
    >
      <label className={`input-label ${labelClassName}`}>{label}</label>
      <div onClick={() => setShow((prev) => !prev)}>
        <div className="input-base flex items-center justify-between">
          <input
            {...props}
            readOnly
            value={value ? (valueLabelMap[value as string] ?? value) : ""}
            className="flex-1 outline-0 placeholder:text-[#000D4D73]"
          />
          <span className="text-[#000D4D73]">
            <ChevronDownIcon width={12} height={8} />
          </span>
        </div>
        {show && (
          // <div className="shadow-drop-down absolute mt-1 max-h-50 w-full overflow-x-hidden overflow-y-visible rounded-lg bg-white p-2">
          <div className="shadow-drop-down absolute mt-1 w-full rounded-lg bg-white p-2 z-10">
            {data.map((item) => (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(item.value);
                }}
                key={item.value}
                className="flex w-full items-center justify-between rounded px-1 py-2 text-left transition-colors hover:bg-[#0015800A]"
              >
                {item.label}
                {value === item.value && (
                  <span className="outline-primary! relative! inline-flex size-2.5 rounded-full bg-primary" />
                )}
              </button>
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
