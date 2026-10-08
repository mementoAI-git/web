import type { ReactNode } from "react";
import { cn } from "@/utility";

type SettingsSectionCardProps = {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  headerAction?: ReactNode;
  className?: string;
};

/** Bordered card with section title — matches Privacy / reference settings cards (24px radius and padding). */
export function SettingsSectionCard({ title, description, children, headerAction, className }: SettingsSectionCardProps) {
  return (
    <div
      className={cn(
        "sky-card relative flex flex-col gap-4 rounded-3xl border border-v3-stroke-weak bg-fill-neutral-weak p-6",
        "motion-safe:transition-shadow motion-safe:duration-200 motion-safe:ease-out",
        className,
      )}
    >
      <div className={cn("flex min-w-0 flex-col gap-1", headerAction && "sm:pr-44")}>
        <h2 className="font-inter text-sm font-semibold text-v3-text-strong">{title}</h2>
        {description ? <div className="font-inter text-sm text-v3-text-weak">{description}</div> : null}
      </div>
      {headerAction ? <div className="self-end sm:absolute sm:right-6 sm:top-6">{headerAction}</div> : null}
      {children ? <div className="flex flex-col gap-4">{children}</div> : null}
    </div>
  );
}
