import {
  StripBanner,
  StripBannerAction,
} from "@/components/strip-banner-frame";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useStore } from "@/hooks/use-store";
import { isOnboardingComplete } from "../onboarding-status";

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

  const complete = isOnboardingComplete(user);
  const skipped = user?.onboarding_status === "skipped";
  if (complete || !skipped) return null;

  return (
    <StripBanner
      // Phones: one compact row with a pill; desktop keeps the wider strip.
      className="flex max-w-full items-center justify-between gap-3 py-2 pr-2 pl-4 md:flex-wrap md:gap-4 md:px-4 md:py-1"
      role="banner"
      onActivate={() => navigate("/onboarding")}
    >
      <p className="min-w-0 text-sm max-md:font-medium">
        Finish setting up your Memento
        <span className="max-md:hidden"> — it only takes a few minutes.</span>
      </p>
      <div className="flex shrink-0 items-center gap-1 md:gap-2">
        <Button
          type="button"
          size="xs"
          variant="secondary"
          className="rounded-full px-3 md:hidden"
          onClick={() => navigate("/onboarding")}
        >
          Continue
        </Button>
        <StripBannerAction onClick={() => navigate("/onboarding")}>
          Continue setup
        </StripBannerAction>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="rounded-full p-1.5 text-icon-neutral-weak transition-colors hover:text-icon-neutral-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-neutral-strong focus-visible:ring-offset-2"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </StripBanner>
  );
}
