"use client";

import { ITexinput } from "./TextInput"
import CalendarIcon from "@/public/icon/calendar-1.svg"
import React, { ChangeEvent, useState } from "react";
import dayjs from "dayjs"
import useClickAway from "@/hooks/use-clickaway"
import { useViewportPosition } from "@/hooks/use-viewport-position"
import DatePicker from "../DatePicker";
import { cn, isEmpty } from "@/utility";

interface IDateinput extends ITexinput {
  minDate?: Date | null
  maxDate?: Date | null
  position?: "top" | "bottom" | "auto"
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
}: IDateinput) {
  const [show, setShow] = useState<boolean>(false)
  const [value, setValue] = useState<Date>(dayjs(`${props.value}`).isValid() ? dayjs(String(props.value)).toDate() : undefined)
  const ref = useClickAway(() => setShow(false))
  const { isInTopHalf, ref: viewportRef } = useViewportPosition()

  const dynamicPosition = position === "auto" || !position
    ? (isInTopHalf ? "bottom" : "top")
    : position

  const handleChange = (selectedDate: Date) => {
    setValue(selectedDate);
    if (onChange) {
      const event = {
        target: {
          name: props.name || "",
          value: dayjs(selectedDate).toISOString(),
        },
      };

      onChange(event as ChangeEvent<HTMLInputElement>)
    }
  };
  return (
    <div
      ref={(el) => {
        ref.current = el;
        viewportRef.current = el;
      }}
      className={`input-container group relative ${props.error ? "error" : ""}`}
    >
      {
        label &&
        <label className={`input-label ${labelClassName}`}>
          {label}{required && <span className="text-orange">*</span>}
        </label>
      }
      <DatePicker
        {...{ setShow, show, position: dynamicPosition }}
        onChange={handleChange}
        options={{ minDate, maxDate }}
      >
        <div className="input-base flex items-center justify-between">
          <input
            onFocus={() => setShow(true)}
            placeholder={dayjs(value).format("DD MMM, YYYY")}
            {...props}
            value={value ? dayjs(value).format("DD MMM, YYYY") : ""}
            className={cn("flex-1 outline-0 placeholder:text-[#000D4D73]", { [className]: !isEmpty(className) })}
          />
          <span className="text-[#000D4D]">
            <CalendarIcon width={15} />
          </span>
        </div>
      </DatePicker>
      {props.error && (
        <small className="text-xs text-danger">{props.error}</small>
      )}
    </div>
  );
}
