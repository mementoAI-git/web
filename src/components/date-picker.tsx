import Datepicker from "tailwind-datepicker-react";
import type { IDatePickerProps } from "tailwind-datepicker-react/types/Components/DatePicker";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { cn } from "@/utility";

const baseOptions = {
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
          <ChevronRightIcon width={16} height={16} />
        </span>
      );
    },
    prev() {
      return (
        <span className="text-[#A4A7AE]">
          <ChevronLeftIcon width={16} height={16} />
        </span>
      );
    },
  },
};

interface DatePickerProps extends IDatePickerProps {
  position?: "top" | "bottom" | "auto";
}

export default function DatePicker(props: DatePickerProps) {
  return (
    <Datepicker
      {...props}
      options={{
        ...baseOptions,
        ...props.options,
        datepickerClassNames: cn("text-black absolute !top-[40px]", {
          "!-top-[370px]": props.position === "top",
        }),
      }}
    >
      {props.children}
    </Datepicker>
  );
}

