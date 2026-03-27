import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStore } from "@/hooks/use-store";

export function OnboardingNudgeBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useStore();
  const [dismissed, setDismissed] = useState(false);

  if (location.pathname === "/onboard" || location.pathname.startsWith("/onboard") || location.pathname === "/onboarding" || location.pathname.startsWith("/onboarding")) {
    return null;
  }
  if (dismissed) return null;

  const complete = user?.onboarding_status === "completed" || user?.onboarded === true;
  const skipped = user?.onboarding_status === "skipped";
  if (complete || !skipped) return null;

  /** New flow: /onboard → welcome → nickname → /onboarding/chat; resume chat if we already have a name. */
  const continueSetupPath = user?.nickname?.trim()
    ? "/onboarding/chat"
    : "/onboard";

  return (
    <div
      className="mb-4 flex w-full max-w-full items-center justify-between gap-4 rounded border-l-4 border-l-v3-stroke-strong bg-v3-fill-weak px-4 py-1"
      role="banner"
    >
      <p className="text-sm text-v3-text-strong">
        Finish setting up your Memento — it only takes a few minutes.
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(continueSetupPath)}
          className="rounded text-sm font-medium text-v3-brand-strong transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-brand-strong focus-visible:ring-offset-2"
        >
          Continue setup →
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="rounded p-1 text-v3-icon-neutral transition-colors hover:text-v3-text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-brand-strong focus-visible:ring-offset-2"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
