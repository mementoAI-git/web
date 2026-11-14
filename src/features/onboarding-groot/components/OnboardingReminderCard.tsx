import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/use-store";
import { isOnboardingComplete } from "../onboarding-status";

/**
 * A standing prompt to finish onboarding. Unlike the dashboard banner it has
 * no dismiss button: it only goes away once onboarding is completed.
 */
export function OnboardingReminderCard() {
  const navigate = useNavigate();
  const { user } = useStore();
  if (!user || isOnboardingComplete(user)) return null;
  return (
    <section aria-label="Finish onboarding" className="insights-card insights-plan">
      <div className="min-w-0 flex-1">
        <h3 className="insights-plan-title font-inter text-base font-semibold text-text-neutral-strong">
          Finish setting up Memento
        </h3>
        <p className="insights-plan-body mt-1 max-w-sm font-inter text-xs text-text-neutral-weak sm:text-sm">
          Tell Memento a little about yourself so your prompts and conversations fit you. It only takes a few minutes.
        </p>
      </div>
      <Button size="sm" variant="ghost" className="insights-plan-action" onClick={() => navigate("/onboarding")}>
        Complete onboarding
      </Button>
    </section>
  );
}
