import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CircleArrowUp } from "lucide-react";
import { useSubscriptionSummary } from "@/features/pricing/use-subscription-summary";

export function PlanSummaryCard({
  onNavigate,
}: {
  onNavigate: (href: string) => void;
}) {
  const { summary } = useSubscriptionSummary();
  if (!summary) return null;
  const isFree = summary.tier === "free";
  const title = isFree
    ? "Unlock more with Pro"
    : summary.status === "trialing"
      ? "You’re on a Memento Pro trial"
      : summary.tier === "legacy"
        ? "You’re on Memento Legacy"
        : "You’re on Memento Pro";
  return (
    <section
      aria-label="Your plan"
      // Free plans get the bright billing card, as a nudge toward upgrading.
      className={cn("insights-card insights-plan", isFree && "insights-plan-free")}
      // A click anywhere on the free card upgrades. The button stays the keyboard and screen reader path.
      onClick={isFree ? () => onNavigate("/pricing") : undefined}
    >
      <div className="min-w-0 flex-1">
        <h3 className="insights-plan-title font-inter text-base font-semibold text-text-neutral-strong">
          {title}
        </h3>
        <p className="insights-plan-body mt-1 max-w-sm font-inter text-xs text-text-neutral-weak sm:text-sm">
          {isFree
            ? "Upgrade for full access to Pro features, expanded storage, and richer memory context."
            : "You have full access to Pro features, expanded storage, and richer memory context."}
        </p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="insights-plan-action"
        onClick={(event) => {
          // The free card handles clicks too; don't navigate twice.
          event.stopPropagation();
          onNavigate(isFree ? "/pricing" : "/settings/billing");
        }}
      >
        {isFree && <CircleArrowUp data-icon="inline-start" aria-hidden />}
        {isFree ? "Upgrade" : "Manage plan"}
      </Button>
    </section>
  );
}
