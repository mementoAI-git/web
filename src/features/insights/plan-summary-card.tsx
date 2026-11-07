import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
    ? "You’re on Memento Free"
    : summary.status === "trialing"
      ? "You’re on a Memento Pro trial"
      : summary.tier === "legacy"
        ? "You’re on Memento Legacy"
        : "You’re on Memento Pro";
  return (
    <section
      aria-label="Your plan"
      // Free plans get the Pro card's tint, as a nudge toward upgrading.
      className={cn("insights-card insights-plan", isFree && "insights-plan-free")}
    >
      <div className="min-w-0 flex-1">
        <h3 className="font-inter text-base font-semibold text-text-neutral-strong">
          {title}
        </h3>
        <p className="mt-1 max-w-sm font-inter text-xs text-text-neutral-weak">
          {isFree
            ? "Upgrade for full access to Pro features, expanded storage, and richer memory context."
            : "You have full access to Pro features, expanded storage, and richer memory context."}
        </p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="insights-plan-action"
        onClick={() => onNavigate(isFree ? "/pricing" : "/settings/billing")}
      >
        {isFree ? "Upgrade" : "Manage plan"}
      </Button>
    </section>
  );
}
