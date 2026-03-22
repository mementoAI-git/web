import type { ReactNode } from "react";
import { EditIcon } from "@/components/icons";
import { cn } from "@/utility";

const iconShellClass =
  "flex size-10 shrink-0 items-center justify-center rounded-full border border-v3-stroke-weak text-v3-text-strong [&_svg]:size-[18px] [&_svg]:shrink-0";

const rowGridClass =
  "grid w-full grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-x-3 sm:grid-cols-[2.5rem_minmax(0,1fr)_4.5rem] sm:gap-x-4";

type SettingsGeneralFieldRowProps = {
  icon: ReactNode;
  label: string;
  /** Shown when there is no primary display value (e.g. placeholder). */
  placeholder: string;
  /** Primary value; when empty, `placeholder` is shown instead. */
  displayValue: string;
  /** Extra nodes after the value line (e.g. copy control). */
  valueAdornment?: ReactNode;
  /** When true, value uses link/brand emphasis (e.g. email). */
  valueEmphasis?: boolean;
  showEdit?: boolean;
  editLabel?: string;
  isEditing: boolean;
  /** Ignored when `showEdit` is false. */
  onToggleEdit?: () => void;
  children?: ReactNode;
};

export function SettingsGeneralFieldRow({
  icon,
  label,
  placeholder,
  displayValue,
  valueAdornment,
  valueEmphasis = false,
  showEdit = true,
  editLabel = "Edit",
  isEditing,
  onToggleEdit = () => {},
  children,
}: SettingsGeneralFieldRowProps) {
  const hasValue = displayValue.trim().length > 0;

  return (
    <div
      className={cn(
        "border-b border-v3-stroke-weak py-4 last:border-b-0",
        "motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out",
      )}
    >
      <div className={rowGridClass}>
        <div className={cn(iconShellClass, "justify-self-center")} aria-hidden>
          {icon}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <span className="font-inter text-sm font-semibold text-v3-text-strong">{label}:</span>
            {hasValue ? (
              <span
                className={cn(
                  "min-w-0 break-words font-inter text-sm",
                  valueEmphasis ? "text-v3-fill-strong" : "text-v3-text-strong",
                )}
              >
                {displayValue}
              </span>
            ) : (
              <span className="font-inter text-sm text-v3-text-weak">{placeholder}</span>
            )}
            {valueAdornment}
          </div>
        </div>

        <div className="flex min-h-10 items-center justify-end justify-self-end">
          {showEdit ? (
            <button
              type="button"
              onClick={onToggleEdit}
              className={cn(
                "inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg",
                "font-inter text-sm font-medium text-v3-text-weak",
                "motion-safe:transition-[color,background-color] motion-safe:duration-200 motion-safe:ease-out",
                "hover:bg-v3-fill-weaker hover:text-v3-text-strong",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2",
              )}
              aria-expanded={isEditing}
              aria-label={isEditing ? `Close ${label} editor` : `${editLabel} ${label}`}
            >
              <EditIcon className="size-[18px]" aria-hidden />
            </button>
          ) : (
            <span className="inline-block min-h-10 min-w-10 sm:min-w-[4.5rem]" aria-hidden />
          )}
        </div>
      </div>

      {isEditing && children ? (
        <div className="mt-4 grid w-full grid-cols-1 gap-x-3 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-x-4">
          <span className="hidden sm:block" aria-hidden />
          <div className="min-w-0 max-w-md">{children}</div>
        </div>
      ) : null}
    </div>
  );
}
