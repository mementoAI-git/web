import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACTION_CLASS =
  "h-12 w-full rounded-full px-7 font-rounded text-base font-semibold sm:w-auto";

/** The full-page layout shared by the 404 and 505 screens. */
export function ErrorState({
  image,
  imageAlt,
  code,
  title,
  description,
  primaryLabel,
  onBack,
  onPrimary,
}: {
  image: string;
  imageAlt: string;
  code: string;
  title: ReactNode;
  description: string;
  primaryLabel: string;
  onBack: () => void;
  onPrimary: () => void;
}) {
  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-background px-4 py-8 sm:px-6">
      <div
        data-testid="error-state-panel"
        className="flex w-full max-w-[520px] flex-col items-center gap-8 rounded-3xl border border-stroke-neutral-weak bg-[color-mix(in_srgb,var(--bg-raised)_60%,transparent)] px-6 py-8 text-center backdrop-blur-xl sm:px-10 sm:py-10"
      >
        <div className="w-full max-w-[300px] rounded-2xl bg-fill-neutral-weak px-4 py-3">
          <img
            src={image}
            alt={imageAlt}
            className="h-[130px] w-full object-contain"
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="font-rounded text-xs font-semibold uppercase tracking-wide text-text-brand-strong">
            {code}
          </span>
          <h1 className="text-balance font-garamond text-3xl font-medium leading-9 text-text-neutral-strong">
            {title}
          </h1>
          <p className="text-balance font-rounded text-base leading-6 text-text-neutral-weak">
            {description}
          </p>
        </div>
        <div className="flex w-full flex-col-reverse items-center justify-center gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className={`${ACTION_CLASS} border-stroke-neutral-weak bg-transparent text-text-neutral-strong`}
            onClick={onBack}
          >
            <ArrowLeft aria-hidden className="size-4" />
            Go back
          </Button>
          <Button type="button" className={ACTION_CLASS} onClick={onPrimary}>
            {primaryLabel}
          </Button>
        </div>
      </div>
    </main>
  );
}
