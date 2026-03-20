import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/logo";
import { cn } from "@/lib/utils";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface OnboardingShellProps {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
  canAdvance: boolean;
  onAdvance: () => void;
  onBack: () => void;
  onSkip: () => void;
  advanceLabel?: string;
  showBack?: boolean;
  showSkip?: boolean;
  hideFooter?: boolean;
  isSaving?: boolean;
  children: React.ReactNode;
}

export function OnboardingShell({
  currentStep,
  totalSteps,
  stepLabel,
  canAdvance,
  onAdvance,
  onBack,
  onSkip,
  advanceLabel = "Continue →",
  showBack = true,
  showSkip = true,
  hideFooter = false,
  children,
  isSaving = false,
}: OnboardingShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (el) el.scrollTop = 0;
  }, [currentStep]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [currentStep]);

  return (
    <div ref={containerRef} className="flex h-screen flex-col overflow-hidden bg-white" role="main" aria-label="Onboarding">
      {/* Topbar */}
      <header className="flex shrink-0 items-center justify-between px-4 py-6 sm:px-6">
        <Link to="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8956C] focus-visible:ring-offset-2 rounded">
          <Logo />
        </Link>
        {showSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-[#B0A098] hover:text-[#7A6A5E] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8956C] focus-visible:ring-offset-2 rounded"
          >
            Skip for now →
          </button>
        )}
      </header>

      {/* Step dots and label */}
      <div className="flex shrink-0 flex-col items-center gap-3 px-4">
        <div className="flex items-center gap-2" aria-hidden>
          {Array.from({ length: totalSteps }, (_, i) => {
            const stepNum = i + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;
            return (
              <span
                key={stepNum}
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-colors",
                  (isCompleted || isCurrent) && "bg-[#E26A24]",
                  !isCompleted && !isCurrent && "bg-[#E4D9CC]"
                )}
              />
            );
          })}
        </div>
        <p className="text-sm text-[#7A6A5E]">{stepLabel}</p>
      </div>

      {/* Content area - scrolls when content overflows */}
      <div
        ref={contentRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:py-8"
      >
        <div className="mx-auto max-w-[560px]">{children}</div>
      </div>

      {/* Footer nav - always visible at bottom when shown */}
      {!hideFooter && (
        <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-[#E4D9CC] bg-white px-4 py-6 sm:px-6">
          <div className="w-20">
            {showBack && (
              <button
                type="button"
                onClick={onBack}
                className="text-sm text-[#B0A098] hover:text-[#7A6A5E] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8956C] focus-visible:ring-offset-2 rounded"
              >
                ← Back
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onAdvance}
            disabled={!canAdvance || isSaving}
            className={cn(
              "rounded-xl px-6 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E26A24] focus-visible:ring-offset-2",
              canAdvance
                ? "bg-[#E26A24] text-white hover:bg-[#C55A1D]"
                : "cursor-not-allowed bg-[#E4D9CC] text-[#7A6A5E]"
            )}
          >
            {isSaving ? "Saving..." : advanceLabel}
          </button>
        </footer>
      )}
    </div>
  );
}
