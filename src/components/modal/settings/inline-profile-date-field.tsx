import Spinner from "@/components/spinner";
import { cn } from "@/utility";
import type { IUser } from "@/utility/interface";
import dayjs from "dayjs";
import { useProfileFieldUpdate } from "./use-profile-field-update";
import {
  profileFieldInputShellClassName,
  profileFieldTextInputClassName,
} from "./profile-field-input-classes";

type InlineProfileDateFieldProps = {
  name: Extract<keyof IUser, "dob">;
  "aria-label": string;
};

export function InlineProfileDateField({ name, "aria-label": ariaLabel }: InlineProfileDateFieldProps) {
  const { value, setValue, isMutating, save, hasUser } = useProfileFieldUpdate(name);

  const dateInputValue =
    value && dayjs(value).isValid() ? dayjs(value).format("YYYY-MM-DD") : "";

  const handleDateChange = (raw: string) => {
    if (!raw) {
      setValue("");
      return;
    }
    setValue(dayjs(raw).isValid() ? dayjs(raw).format("YYYY-MM-DD") : raw);
  };

  return (
    <div className="input-container group max-w-md">
      <div
        className={cn(
          "input-base flex items-center justify-between gap-2 rounded-md px-3 py-2",
          profileFieldInputShellClassName,
        )}
      >
        <input
          type="date"
          name={name}
          aria-label={ariaLabel}
          disabled={!hasUser}
          value={dateInputValue}
          onChange={(e) => handleDateChange(e.target.value)}
          className={cn(
            "min-w-0 flex-1 cursor-pointer bg-transparent font-inter text-sm outline-none",
            profileFieldTextInputClassName,
          )}
        />
        <button
          type="button"
          disabled={isMutating || !hasUser}
          onClick={() => void save()}
          className="shrink-0 cursor-pointer font-inter text-sm font-medium capitalize text-v3-text-weak disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isMutating ? <Spinner loading className="!size-4 !text-v3-text-weak" /> : "Update"}
        </button>
      </div>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function formatProfileDobDisplay(cached: string): string {
  if (!cached || !dayjs(cached).isValid()) return "";
  return dayjs(cached).format("MMMM D, YYYY");
}
