"use client";

import { ITexinput } from "./TextInput";
import CalendarIcon from "@/public/icon/calendar.svg";
import ChevronRightIcon from "@/public/icon/chevron-right.svg";
import ChevronLeftIcon from "@/public/icon/chevron-left.svg";
import React, { useState } from "react";
import Datepicker from "tailwind-datepicker-react";
import dayjs from "dayjs";
import useClickAway from "@/hooks/use-clickaway";

const options = {
  theme: {
    background: "!bg-white !top-2 !border !border-[#E9EAEB] !shadow-drop-down",
    todayBtn: "!bg-[#7F56D9]",
    clearBtn:
      "!bg-transparent !text-[#414651] !font-semibold !text-sm !border-[#D5D7DA] border",
    icons:
      "!bg-transparent !text-[#414651] !font-semibold !font-inter !cursor-pointer hover:!bg-[#F3F3F3]/50",
    text: "!font-inter !text-sm !font-normal !text-[#414651] !rounded-full hover:!bg-[#F3F3F3]",
    disabledText:
      "!text-[#717680] !font-inter !font-normal !rounded-full hover:!bg-[#F3F3F3]/50",
    input: "",
    inputIcon: "",
    selected: "!rounded-full !bg-[#050709] !hover:bg-[#050709] !text-white",
  },
  datepickerClassNames: "text-black !top-20",
  icons: {
    next() {
      return (
        <span className="text-[#A4A7AE]">
          <ChevronRightIcon />
        </span>
      );
    },
    prev() {
      return (
        <span className="text-[#A4A7AE]">
          <ChevronLeftIcon width={8} />
        </span>
      );
    },
  },
};

export function Dateinput({ id, label, onChange, ...props }: ITexinput) {
  const [show, setShow] = useState<boolean>(false);
  const [value, setValue] = useState(dayjs().toDate());
  const ref = useClickAway(() => setShow(false));

  const handleChange = (selectedDate: Date) => {
    setValue(selectedDate);
    if (onChange) {
      const event = {
        target: {
          name: props.name || "",
          value: dayjs(selectedDate).format("DD-MM-YYYY"),
        },
      };

      onChange(event as any);
    }
  };
  return (
    <div
      ref={ref}
      className={`input-container group relative ${props.error ? "error" : ""}`}
    >
      <label className="input-label">{label}</label>
      <Datepicker
        setShow={setShow}
        onChange={handleChange}
        show={show}
        classNames=""
        options={options}
      >
        <div className="input-base flex items-center justify-between">
          <input
            onFocus={() => setShow(true)}
            placeholder="DD-MM-YYYY"
            {...props}
            value={value ? dayjs(value).format("DD-MM-YYYY") : ""}
            className="flex-1 outline-0 placeholder:text-[#000D4D73]"
          />
          <CalendarIcon />
        </div>
      </Datepicker>
      {props.error && (
        <small className="text-xs text-danger">{props.error}</small>
      )}
    </div>
  );
}
