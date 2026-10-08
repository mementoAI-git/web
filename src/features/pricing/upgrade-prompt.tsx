import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PricingOverlay } from "./pricing-overlay";
import type { FeatureKey } from "./types";
import { UPGRADE_COPY } from "./upgrade-copy";

export type UpgradePromptVariant = "modal" | "inline" | "tooltip";

export interface UpgradePromptProps {
  feature: FeatureKey;
  variant: UpgradePromptVariant;
  /** Controlled open state for modal variant */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDismiss?: () => void;
  onUpgrade?: () => void;
  upgradeLabel?: string;
  className?: string;
  /** Tooltip / inline: wraps trigger content */
  children?: ReactNode;
}

export function UpgradePrompt({
  feature,
  variant,
  open,
  onOpenChange,
  onDismiss,
  onUpgrade,
  upgradeLabel = "Upgrade to Pro",
  className,
  children,
}: UpgradePromptProps) {
  const copy = UPGRADE_COPY[feature];
  const handleDismiss = () => {
    onDismiss?.();
    onOpenChange?.(false);
  };
  if (variant === "tooltip")
    return (
      <span
        className={cn("inline-flex", className)}
        title={`${copy.title} — ${copy.description}`}
      >
        {children}
      </span>
    );
  if (variant === "inline")
    return (
      <div
        role="region"
        aria-label={copy.title}
        className={cn(
          "rounded-2xl border border-stroke-neutral-weak bg-fill-neutral-weaker px-4 py-3 font-inter text-sm text-text-neutral-strong",
          className,
        )}
      >
        <p className="font-semibold">{copy.title}</p>
        <p className="mt-1 text-text-neutral-weak">{copy.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={onUpgrade}>
            {upgradeLabel}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDismiss}>
            Not now
          </Button>
        </div>
      </div>
    );
  if (!open) return null;
  return (
    <PricingOverlay
      open={Boolean(open)}
      onOpenChange={(next) => (next ? onOpenChange?.(true) : handleDismiss())}
      title={copy.title}
      description={copy.description}
      onUpgrade={onUpgrade}
      upgradeLabel={upgradeLabel}
      dismissLabel="Let me think about it"
      className={className}
    />
  );
}
