"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";
import dayjs from "dayjs";
import { cn } from "@/utility";
import DatePicker from "@/components/date-picker";
import { Calendar1Icon } from "@/components/icons";
import useClickAway from "@/hooks/use-clickaway";
import { useViewportPosition } from "@/hooks/use-viewport-position";
import type { ITexinput } from "./text-input";

interface DateInputProps extends ITexinput {
  minDate?: Date | null;
  maxDate?: Date | null;
  position?: "top" | "bottom" | "auto";
}

export function Dateinput({
  label,
  onChange,
  className = "",
  labelClassName = "",
  required = false,
  position = "auto",
  minDate = null,
  maxDate = null,
  ...props
}: DateInputProps) {
  const [show, setShow] = useState(false);
  const [value, setValue] = useState<Date | null>(
    dayjs(`${props.value}`).isValid() ? dayjs(String(props.value)).toDate() : null,
  );
  const ref = useClickAway(() => setShow(false));
  const { isInTopHalf, ref: viewportRef } = useViewportPosition();

  const dynamicPosition =
    position === "auto" || !position ? (isInTopHalf ? "bottom" : "top") : position;

  const handleChange = (selectedDate: Date) => {
    setValue(selectedDate);
    if (onChange) {
      const event = {
        target: {
          name: props.name || "",
          value: dayjs(selectedDate).toISOString(),
        },
      };

      onChange(event as ChangeEvent<HTMLInputElement>);
    }
  };

  const containerClass = cn("input-container group relative", {
    error: Boolean(props.error),
  });

  return (
    <div
      ref={(el) => {
        ref.current = el;
        viewportRef.current = el;
      }}
      className={containerClass}
    >
      {label && (
        <label className={cn("input-label", labelClassName)}>
          {label}
          {required && <span className="text-orange">*</span>}
        </label>
      )}
      <DatePicker
        setShow={setShow}
        show={show}
        position={dynamicPosition}
        onChange={handleChange}
        options={{ minDate: minDate ?? undefined, maxDate: maxDate ?? undefined }}
      >
        <div className="input-base flex items-center justify-between">
          <input
            onFocus={() => setShow(true)}
            placeholder={value ? dayjs(value).format("DD MMM, YYYY") : props.placeholder}
            {...props}
            value={value ? dayjs(value).format("DD MMM, YYYY") : ""}
            className={cn("flex-1 outline-0 placeholder:text-[#000D4D73]", className)}
            readOnly
          />
          <span className="text-[#000D4D]">
            <Calendar1Icon width={16} height={16} />
          </span>
        </div>
      </DatePicker>
      {props.error && <small className="text-xs text-danger">{props.error}</small>}
    </div>
  );
}

