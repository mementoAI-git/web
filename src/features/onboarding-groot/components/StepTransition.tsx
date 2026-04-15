import * as React from "react";
import { cn } from "@/lib/utils";

export interface StepTransitionProps {
  stepKey: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps step content with enter animation.
 * Key changes trigger React to unmount/remount, so the new content
 * animates in (opacity 0→1, translateY 12px→0, 220ms ease-out, 160ms delay).
 */
export function StepTransition({ stepKey, children, className }: StepTransitionProps) {
  return (
    <div
      key={stepKey}
      className={cn("onboarding-step-in", className)}
    >
      {children}
    </div>
  );
}
