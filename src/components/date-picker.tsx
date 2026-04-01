import Datepicker from "tailwind-datepicker-react";
import type { IDatePickerProps } from "tailwind-datepicker-react/types/Components/DatePicker";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { cn } from "@/utility";

const baseOptions = {
  theme: {
    background: "!bg-white !top-2 !border !border-stroke-neutral-weaker !shadow-drop-down",
    todayBtn: "!bg-orange",
    clearBtn:
      "!bg-transparent !text-text-neutral-strong !font-semibold !text-sm !border-stroke-neutral-weak border",
    icons:
      "!bg-transparent !text-text-neutral-strong !font-semibold !font-inter !cursor-pointer hover:!bg-fill-neutral-weaker",
    text: "!font-inter !text-sm !font-normal !text-text-neutral-strong !rounded-full hover:!bg-fill-neutral-weaker",
    disabledText:
      "!text-text-neutral-weaker !font-inter !font-normal !rounded-full hover:!bg-fill-neutral-weaker",
    input: "",
    inputIcon: "",
    selected: "!rounded-full !bg-orange !hover:!opacity-90 !text-white",
  },
  icons: {
    next() {
      return (
        <span className="text-text-neutral-weaker">
          <ChevronRightIcon width={16} height={16} />
        </span>
      );
    },
    prev() {
      return (
        <span className="text-text-neutral-weaker">
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

