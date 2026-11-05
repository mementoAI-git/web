import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

/** Label on the left, its value and any inline action on the right. */
export function SettingsFieldRow({
  htmlFor,
  label,
  hint,
  children,
}: {
  htmlFor: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <Label
        htmlFor={htmlFor}
        className="shrink-0 text-sm font-normal text-text-neutral-strong"
      >
        {label}
        {hint ? <span className="text-text-neutral-weak"> {hint}</span> : null}
      </Label>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        {children}
      </div>
    </div>
  );
}
