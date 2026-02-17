import useClickAway from "@/hooks/use-clickaway";
import { cn } from "@/utility";
import { useState } from "react";
import dayjs from "dayjs";

type DateOption = {
  label: string;
  value: number;
  unit: "hours" | "days" | "weeks" | "months" | "years";
};

type DateOptionsDropdownProps = {
  options?: DateOption[];
  onDateSelect: (date: Date) => void;
  showCustomDate?: boolean;
  defaultLabel?: string;
  dropDirection?: "up" | "down";
  CustomCalendarComponent?: React.ComponentType<{
    onDateSelect: (date: Date) => void;
    onClose: () => void;
  }>;
};

const DEFAULT_OPTIONS: DateOption[] = [
  { label: "In 24 hours", value: 24, unit: "hours" },
  { label: "In 3 days", value: 3, unit: "days" },
  { label: "In 1 week", value: 1, unit: "weeks" },
  { label: "Last day of this month", value: 0, unit: "months" },
];

export default function DateOptionsDropdown({
  options = DEFAULT_OPTIONS,
  onDateSelect,
  showCustomDate = true,
  defaultLabel = "Select date",
  dropDirection = "down",
  CustomCalendarComponent,
}: DateOptionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(defaultLabel);
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);
  const ref = useClickAway(() => {
    setIsOpen(false);
    setShowCustomCalendar(false);
  });

  const positionClasses =
    dropDirection === "up" ? "bottom-full mb-2" : "top-full mt-2";

  const chevronClasses = cn("w-5 h-5 text-gray-400 transition-transform", {
    "rotate-180": dropDirection === "down" ? isOpen : !isOpen,
  });

  const calculateDate = (option: DateOption): Date => {
    const now = new Date();

    if (
      option.label.toLowerCase().includes("last day of") &&
      option.unit === "months"
    ) {
      return new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    switch (option.unit) {
      case "hours":
        return new Date(now.getTime() + option.value * 60 * 60 * 1000);
      case "days":
        return new Date(now.getTime() + option.value * 24 * 60 * 60 * 1000);
      case "weeks":
        return new Date(now.getTime() + option.value * 7 * 24 * 60 * 60 * 1000);
      case "months":
        return new Date(now.setMonth(now.getMonth() + option.value));
      case "years":
        return new Date(now.setFullYear(now.getFullYear() + option.value));
      default:
        return now;
    }
  };

  const handleOptionClick = (option: DateOption) => {
    setSelectedLabel(option.label);
    onDateSelect(calculateDate(option));
    setIsOpen(false);
  };

  const handleCustomDateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCustomCalendar(true);
  };

  const handleCustomCalendarSelect = (date: Date) => {
    setSelectedLabel(dayjs(date).format("DD MMM YYYY"));
    onDateSelect(date);
    setShowCustomCalendar(false);
    setIsOpen(false);
  };

  const handleCustomCalendarClose = () => {
    setShowCustomCalendar(false);
  };

  return (
    <div ref={ref} className="relative w-full max-w-md">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-green-0 flex items-center justify-between"
      >
        <span>{selectedLabel}</span>
        <svg
          className={chevronClasses}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown List */}
      {isOpen && !showCustomCalendar && (
        <div
          className={cn(
            "absolute font-normal text-sm leading-5 z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg",
            positionClasses,
          )}
        >
          <div className="py-1">
            {options.map((option, index) => (
              <button
                type="button"
                key={index}
                onClick={() => handleOptionClick(option)}
                className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors flex items-center justify-between group"
              >
                <span>{option.label}</span>
                {selectedLabel === option.label && (
                  <span className="w-5 h-5 rounded-full border border-[#5A00E8] flex items-center justify-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#5A00E8] font-medium align-middle"></span>
                  </span>
                )}
              </button>
            ))}

            {showCustomDate && (
              <>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  type="button"
                  onClick={handleCustomDateClick}
                  className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors flex items-center gap-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14 7.66732V5.86732C14 4.74721 14 4.18716 13.782 3.75934C13.5903 3.38301 13.2843 3.07705 12.908 2.8853C12.4802 2.66732 11.9201 2.66732 10.8 2.66732H5.2C4.0799 2.66732 3.51984 2.66732 3.09202 2.8853C2.71569 3.07705 2.40973 3.38301 2.21799 3.75934C2 4.18716 2 4.74721 2 5.86732V11.4673C2 12.5874 2 13.1475 2.21799 13.5753C2.40973 13.9516 2.71569 14.2576 3.09202 14.4493C3.51984 14.6673 4.0799 14.6673 5.2 14.6673H8.33333M14 6.66732H2M10.6667 1.33398V4.00065M5.33333 1.33398V4.00065M12 14.0007V10.0007M10 12.0007H14"
                      stroke="#A0A7B1"
                      strokeWidth="1.33333"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Set custom date</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Custom Calendar */}
      {showCustomCalendar && CustomCalendarComponent && (
        <div className={cn("absolute z-20 p-4", positionClasses)}>
          <CustomCalendarComponent
            onDateSelect={handleCustomCalendarSelect}
            onClose={handleCustomCalendarClose}
          />
        </div>
      )}
    </div>
  );
}
