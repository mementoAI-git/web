import { useCallback, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import dayjs from "dayjs";

import { Button } from "@/components/ui/button";
import { cn } from "@/utility";
import { useSubscription } from "@/contexts/subscription";

const DISMISS_KEY = "memento_trial_banner_dismissed";

export function TrialBanner() {
  const location = useLocation();
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
    if (status !== "trialing" || !trialEndsAt) return { show: false, message: "" };
    const end = dayjs(trialEndsAt);
    if (!end.isValid()) return { show: false, message: "" };

    const daysLeft = Math.max(0, end.diff(dayjs(), "day"));
    const dayNumber = 14 - daysLeft;
    const urgency = dayNumber >= 10;

    const base = urgency ?
      `Your trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.` :
      `You're on a 14-day Pro trial — ${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining.`;

    return { show: true, message: base };
  }, [isLoading, dismissed, status, trialEndsAt]);

  if (!show) return null;

  return (
    <div
      className={cn(
        "mb-2 flex flex-col gap-2 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 sm:flex-row sm:items-center sm:justify-between",
      )}
      role="status"
    >
      <p className="font-inter text-sm text-amber-950">
        {message}{" "}
        <Link
          to="/pricing"
          state={{ returnTo: location.pathname + location.search + location.hash }}
          className="font-semibold underline underline-offset-2 hover:opacity-90"
        >
          Upgrade now
        </Link>
        <span aria-hidden> →</span>
      </p>
      <div className="flex shrink-0 gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 rounded-full text-amber-950 hover:bg-amber-100/80"
          onClick={dismiss}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}
