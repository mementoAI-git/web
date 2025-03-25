import { ITexinput } from "./TextInput"
import CalendarIcon from "@/public/icon/calendar.svg"
import { useState } from "react"
import Datepicker from "tailwind-datepicker-react"

const options = {
  title: "Demo Title",
  autoHide: true,
  todayBtn: false,
  clearBtn: true,
  clearBtnText: "Clear",
  maxDate: new Date("2030-01-01"),
  minDate: new Date("1950-01-01"),
  theme: {
    background: "bg-gray-700 dark:bg-gray-800",
    todayBtn: "",
    clearBtn: "",
    icons: "",
    text: "",
    disabledText: "bg-red-500",
    input: "",
    inputIcon: "",
    selected: "",
  },
  icons: {
    // () => ReactElement | JSX.Element
    prev: () => <span>Previous</span>,
    next: () => <span>Next</span>,
  },
  datepickerClassNames: "top-12",
  defaultDate: new Date("2022-01-01"),
  language: "en",
  disabledDates: [],
  weekDays: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
  inputNameProp: "date",
  inputIdProp: "date",
  inputPlaceholderProp: "Select Date",
  inputDateFormatProp: {
    day: "numeric",
    month: "long",
    year: "numeric"
  }
}

export function Dateinput({ label, onChange, ...props }: ITexinput) {
  const [show, setShow] = useState(false)

  const handleClose = (state: boolean) => {
    setShow(state)
  }
  return (
    <div className="flex gap-1.5 flex-col justify-start">
      <label className="font-inter text-secondary font-medium text-sm leading-5 capitalize">{label}</label>
      <div className="bg-white flex items-center justify-between shadow-sm py-2 px-3 focus-within:border-primary focus-within:border-[1.5px] rounded-lg border border-grey-100 h-10">
        <input type="password" placeholder="DD-MM-YYYY" {...props} className="flex-1 outline-0 placeholder:text-[#000D4D73]" />
        <CalendarIcon />
        <Datepicker
          options={options}
          onChange={onChange}
          show={show}
          setShow={handleClose}
        />
      </div>
    </div>
  )
}