"use client";

import { DropdownButton } from "@/components/Dropdown";
import { useState } from "react";
import { useModal } from "@/hooks/use-modal";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Checkbox } from "@/components/Form";


const FILTER_LABELS = {
  all: "All",
  bookmarked: "Bookmarked",
  deleted: "Deleted",
  // "custom-date": "Custom date"
};

const DISPLAY_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Bookmarked", value: "bookmarked" },
  { label: "Deleted", value: "deleted" },
  // { label: "Custom date", value: "custom-date" },
];

interface IMemoryListFilter {
  value?: string;
  onChange: (v: string) => void;
  onSetDateRange: (range: { from?: Date; to?: Date }) => void;
}

function FilterCheckboxOption({ onClick, item, value }: any) {
  const isChecked = item.value === value;

  return (
    <li
      onClick={() => onClick(item.value)}
      className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-text-neutral-weak"
    >
      <Checkbox label={item.label} checked={isChecked} />
    </li>
  );
}

export function StoriesListFilter({ value = "all", onChange, onSetDateRange }: IMemoryListFilter) {
  const { open } = useModal();

  const handleSelect = (selectedValue: string) => {
    if (selectedValue === "custom-date") {
      open("date-picker-filter", { onSetDateRange });
    } else {
      onChange(selectedValue);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Display Dropdown */}
      <DropdownButton
        title={
          <div className="flex items-center gap-2 ">
            <span className="font-inter text-sm text-gray-700">Display: {FILTER_LABELS[value] || value}</span>
            {/* <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg> */}
          </div>
        }
        onSelect={handleSelect}
        ItemLayout={({ onClick, item }) => <FilterCheckboxOption {...{ onClick, item, value }} />}
        items={DISPLAY_OPTIONS}
        value={value}
      />
    </div>
  );
}

export function DatePickerFilter({ data }: any) {
  const { close } = useModal();
  const onSetDateRange = data?.onSetDateRange;

  const [range, setRange] = useState<DateRange | undefined>(undefined);

  const handleApply = () => {
    if (range?.from && range?.to) {
      onSetDateRange?.(range);
    }
    close("date-picker-filter");
  };

  const handleCancel = () => {
    close("date-picker-filter");
  };

  const formatDate = (date?: Date) =>
    date
      ? date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6">
        <div className="flex md:hidden flex-col sm:flex-col items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={formatDate(range?.from)}
              readOnly
              placeholder="Start date"
              className="px-1 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
            />
            <span className="text-gray-500">-</span>
            <input
              type="text"
              value={formatDate(range?.to)}
              readOnly
              placeholder="End date"
              className="px-1 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
            />
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={setRange}
            numberOfMonths={2}
            pagedNavigation
            showOutsideDays
          />
        </div>

        <div className="flex flex-row justify-between">
          <div className="hidden md:flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={formatDate(range?.from)}
                readOnly
                placeholder="Start date"
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
              />
              <span className="text-gray-500">-</span>
              <input
                type="text"
                value={formatDate(range?.to)}
                readOnly
                placeholder="End date"
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!range?.from || !range?.to}
              className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-colors ${range?.from && range?.to
                ? "bg-[#52A1DD] text-white hover:bg-[#4299E1]"
                : "bg-gray-300 text-gray-600 cursor-not-allowed"
                }`}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}