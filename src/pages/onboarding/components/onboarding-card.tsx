import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OnboardingButton({
  className,
  variant = "default",
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      variant={variant}
      className={cn(
        "h-12 rounded-lg px-[27px] font-geist text-base font-bold leading-6 shadow-sm",
        variant === "default"
          ? "min-w-32 border-stroke-brand-strong bg-fill-brand-strong [background-image:var(--gradient-overview-story)] text-text-inverse-strong"
          : "min-w-[97px] border-stroke-neutral-weak bg-bg-neutral text-text-neutral-strong hover:bg-fill-neutral-weaker",
        className,
      )}
      {...props}
    />
  );
}

export function OnboardingCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex w-full max-w-[560px] flex-col gap-6 rounded-[32px] border border-stroke-neutral-weak bg-bg-neutral p-[23px] text-text-neutral-strong",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function OnboardingTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={cn(
        "max-w-full font-garamond text-[32px] font-medium leading-[40px] sm:text-[40px] sm:leading-[48px]",
        className,
      )}
    >
      {children}
    </h1>
  );
}

export function OnboardingProgress({ step }: { step: number }) {
  return (
    <div
      role="progressbar"
      aria-label="Onboarding progress"
      aria-valuemin={1}
      aria-valuemax={4}
      aria-valuenow={step}
      className="relative flex h-3 w-[84px] items-center justify-between"
    >
      {[14, 38, 62].map((left) => (
        <span
          key={left}
          aria-hidden
          className="absolute top-1/2 h-px w-2 bg-stroke-neutral-weak"
          style={{ left }}
        />
      ))}
      {[1, 2, 3, 4].map((value) => (
        <span
          key={value}
          aria-hidden
          className={cn(
            "relative size-3 rounded-full",
            value <= step ? "bg-fill-brand-strong" : "bg-stroke-neutral-weak",
          )}
        />
      ))}
    </div>
  );
}

export function OnboardingQuestionFrame({
  step,
  children,
}: {
  step: number;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-12">
      <OnboardingProgress step={step} />
      {children}
    </div>
  );
}

export function OnboardingActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full items-center justify-end gap-2.5">
      {children}
    </div>
  );
}
