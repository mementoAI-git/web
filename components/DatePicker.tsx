import Datepicker from "tailwind-datepicker-react"
import ChevronRightIcon from "@/public/icon/chevron-right.svg"
import ChevronLeftIcon from "@/public/icon/chevron-left.svg"
import { IDatePickerProps } from "tailwind-datepicker-react/types/Components/DatePicker";
import { cn } from "@/utility";

const options = {
  theme: {
    background: "!bg-white !top-2 !border !border-[#E9EAEB] !shadow-drop-down",
    todayBtn: "!bg-blue-6",
    clearBtn:
      "!bg-transparent !text-[#414651] !font-semibold !text-sm !border-[#D5D7DA] border",
    icons:
      "!bg-transparent !text-[#414651] !font-semibold !font-inter !cursor-pointer hover:!bg-[#F3F3F3]/50",
    text: "!font-inter !text-sm !font-normal !text-[#414651] !rounded-full hover:!bg-[#F3F3F3]",
    disabledText:
      "!text-[#717680] !font-inter !font-normal !rounded-full hover:!bg-[#F3F3F3]/50",
    input: "",
    inputIcon: "",
    selected: "!rounded-full !bg-blue-6 !hover:bg-[#050709] !text-white",
  },
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

interface IDatePicker extends IDatePickerProps {
  position?: "top" | "bottom" | "auto"
}

export default function DatePicker(props: IDatePicker) {
  return (
    <Datepicker
      {...props}
      options={{
        ...options,
        ...props.options,
        datepickerClassNames: cn("text-black absolute !top-[40px]", { "!-top-[370px]": props.position === "top" })
      }}
    >
      {props.children}
    </Datepicker>
  )
}