import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/utility";

type SettingsActionRowProps = {
  label: ReactNode;
  action: ReactNode;
  className?: string;
};

/** Label left, control right — `justify-between`, vertically centered. */
export function SettingsActionRow({ label, action, className }: SettingsActionRowProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div className="font-inter text-sm text-v3-text-weak">{label}</div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

const pillBase =
  "inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full px-4 py-2 font-inter text-sm font-semibold " +
  "motion-safe:transition-[opacity,background-color,border-color,color] motion-safe:duration-200 motion-safe:ease-out " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

// eslint-disable-next-line react-refresh/only-export-components
export const settingsPillButtonClass = {
  /** Outline, dark label — e.g. Log out, Change password */
  default: cn(pillBase, "border border-stroke-neutral-weak bg-transparent text-text-neutral-strong hover:bg-fill-neutral-weak"),
  /** Muted outline — e.g. Coming soon */
  secondary: cn(
    pillBase,
    "cursor-not-allowed border border-stroke-neutral-disabled bg-transparent text-text-neutral-disabled",
  ),
  /** Solid destructive */
  destructive: cn(pillBase, "border border-transparent bg-danger text-white hover:opacity-90"),
} as const;

export type SettingsPillVariant = keyof typeof settingsPillButtonClass;

type SettingsPillButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: SettingsPillVariant;
};

export function SettingsPillButton({ variant, className, type = "button", ...props }: SettingsPillButtonProps) {
  return <button type={type} className={cn(settingsPillButtonClass[variant], className)} {...props} />;
}
