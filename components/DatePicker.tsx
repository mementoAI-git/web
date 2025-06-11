import Datepicker from "tailwind-datepicker-react"
import ChevronRightIcon from "@/public/icon/chevron-right.svg"
import ChevronLeftIcon from "@/public/icon/chevron-left.svg"
import { IDatePickerProps } from "tailwind-datepicker-react/types/Components/DatePicker";

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

export default function DatePicker(props: IDatePickerProps) {
  return (
    <Datepicker {...props} options={{ ...options, ...props.options }}>
      {props.children}
    </Datepicker>
  )
}