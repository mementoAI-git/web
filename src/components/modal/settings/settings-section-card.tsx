import type { ReactNode } from "react";
import { cn } from "@/utility";

type SettingsSectionCardProps = {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Bordered card with section title — matches Privacy / reference settings cards (~16px radius, 24px padding). */
export function SettingsSectionCard({ title, description, children, className }: SettingsSectionCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-v3-stroke-weak bg-bg-neutral p-6",
        "motion-safe:transition-shadow motion-safe:duration-200 motion-safe:ease-out",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="font-inter text-sm font-semibold text-v3-text-strong">{title}</h2>
        {description ? <div className="font-inter text-sm text-v3-text-weak">{description}</div> : null}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}
