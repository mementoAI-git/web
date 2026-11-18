import { useContext, type ComponentProps, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { OnboardingHeaderSlot } from "./onboarding-header-slot";
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
        "h-12 rounded-full px-[27px] font-geist text-base font-bold leading-6 shadow-sm",
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
        // Phones show the content flat on the page; desktop keeps the card.
        "flex w-full max-w-[560px] flex-col gap-6 rounded-[32px] border border-stroke-neutral-weak bg-bg-neutral p-[23px] text-text-neutral-strong max-md:rounded-none max-md:border-0 max-md:p-0",
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
  const headerSlot = useContext(OnboardingHeaderSlot);
  const inHeader = useIsMobile() && headerSlot !== null;
  return (
    <div className="flex w-full flex-col items-center gap-12">
      {inHeader ? (
        createPortal(<OnboardingProgress step={step} />, headerSlot)
      ) : (
        <OnboardingProgress step={step} />
      )}
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
