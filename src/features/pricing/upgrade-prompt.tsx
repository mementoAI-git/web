import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/utility";

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

  const handleUpgrade = () => {
    onUpgrade?.();
  };

  if (variant === "tooltip") {
    return (
      <span
        className={cn("inline-flex", className)}
        title={`${copy.title} — ${copy.description}`}
      >
        {children}
      </span>
    );
  }

  if (variant === "inline") {
    return (
      <div
        role="region"
        aria-label={copy.title}
        className={cn(
          "rounded-2xl border border-v3-stroke-weak bg-v3-fill-weaker px-4 py-3 font-inter text-sm text-v3-text-strong",
          className,
        )}
      >
        <p className="font-semibold">{copy.title}</p>
        <p className="mt-1 text-v3-text-weak">{copy.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" className="rounded-full" onClick={handleUpgrade}>
            {upgradeLabel}
          </Button>
          <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={handleDismiss}>
            Not now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange?.(next);
      }}
    >
      <DialogContent className={className} showCloseButton>
        <DialogHeader>
          <DialogTitle className="font-garamond text-xl">{copy.title}</DialogTitle>
          <DialogDescription className="font-inter text-v3-text-weak">
            {copy.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" className="rounded-full" onClick={handleDismiss}>
            Maybe later
          </Button>
          <Button type="button" className="rounded-full" onClick={handleUpgrade}>
            {upgradeLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
