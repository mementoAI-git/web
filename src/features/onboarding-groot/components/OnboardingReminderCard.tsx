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
    <section aria-label="Finish onboarding" className="insights-card insights-plan insights-onboarding">
      <div className="min-w-0 flex-1">
        <h3 className="insights-plan-title font-inter text-[15px] font-semibold leading-5 text-text-neutral-strong">
          Finish setting up Memento
        </h3>
        <p className="insights-plan-body mt-0.5 font-inter text-[13px] leading-[18px] text-text-neutral-weak">
          A few quick questions so Memento fits you.
        </p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="insights-plan-action"
        aria-label="Complete onboarding"
        onClick={() => navigate("/onboarding")}
      >
        Start
      </Button>
    </section>
  );
}
