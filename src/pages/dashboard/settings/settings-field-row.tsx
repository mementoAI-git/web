import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

/** Label on the left, its value and any inline action on the right. */
export function SettingsFieldRow({
  htmlFor,
  label,
  children,
}: {
  htmlFor: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 py-3.5 first-of-type:pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <Label
        htmlFor={htmlFor}
        className="shrink-0 text-sm font-normal text-text-neutral-strong sm:w-32"
      >
        {label}
      </Label>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        {children}
      </div>
    </div>
  );
}
