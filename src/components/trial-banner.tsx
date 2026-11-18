import { StripBanner, StripBannerAction } from "./strip-banner-frame";
import { useCallback, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import { Button } from "@/components/ui/button";
import { useSubscription } from "@/contexts/subscription";

const DISMISS_KEY = "memento_trial_banner_dismissed";

export function TrialBanner() {
  const location = useLocation();
  const navigate = useNavigate();
  const pricingState = {
    returnTo: location.pathname + location.search + location.hash,
  };
  const { status, trialEndsAt, isLoading } = useSubscription();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }, []);

  const { show, message } = useMemo(() => {
    if (isLoading || dismissed) return { show: false, message: "" };
    if (status !== "trialing" || !trialEndsAt)
      return { show: false, message: "" };
    const end = dayjs(trialEndsAt);
    if (!end.isValid()) return { show: false, message: "" };

    const daysLeft = Math.max(0, end.diff(dayjs(), "day"));
    const dayNumber = 14 - daysLeft;
    const urgency = dayNumber >= 10;

    const base = urgency
      ? `Your trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`
      : `You're on a 14-day Pro trial — ${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining.`;

    return { show: true, message: base };
  }, [isLoading, dismissed, status, trialEndsAt]);

  if (!show) return null;

  return (
    <StripBanner
      onActivate={() => navigate("/pricing", { state: pricingState })}
      className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="font-inter text-sm">
        {message}{" "}
        <Link
          to="/pricing"
          state={pricingState}
          className="font-semibold underline underline-offset-2 hover:opacity-90"
        >
          Upgrade now
        </Link>
        <span aria-hidden> →</span>
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <StripBannerAction
          onClick={() => navigate("/pricing", { state: pricingState })}
        >
          Upgrade
        </StripBannerAction>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 rounded-full text-text-neutral-strong hover:bg-fill-neutral-weak"
          onClick={dismiss}
        >
          Dismiss
        </Button>
      </div>
    </StripBanner>
  );
}
