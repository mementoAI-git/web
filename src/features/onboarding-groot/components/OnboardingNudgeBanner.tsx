import { StripBannerFrame } from "@/components/strip-banner-frame";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStore } from "@/hooks/use-store";

export function OnboardingNudgeBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useStore();
  const [dismissed, setDismissed] = useState(false);

  if (
    location.pathname === "/onboarding" ||
    location.pathname.startsWith("/onboarding")
  ) {
    return null;
  }
  if (dismissed) return null;

  const complete =
    user?.onboarding_status === "completed" || user?.onboarded === true;
  const skipped = user?.onboarding_status === "skipped";
  if (complete || !skipped) return null;

  return (
    <StripBannerFrame>
      <div
        className="flex w-full max-w-full flex-wrap items-center justify-between gap-4 rounded border-l-4 border-l-stroke-info-strong bg-fill-info-weak px-4 py-1"
        role="banner"
      >
        <p className="text-sm text-text-info-strong">
          Finish setting up your Memento — it only takes a few minutes.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/onboarding")}
            className="rounded text-sm font-medium text-text-info-strong transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-brand-strong focus-visible:ring-offset-2"
          >
            Continue setup →
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="rounded p-1 text-icon-info-strong transition-colors hover:text-text-info-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-brand-strong focus-visible:ring-offset-2"
          >
            ✕
          </button>
        </div>
      </div>
    </StripBannerFrame>
  );
}
