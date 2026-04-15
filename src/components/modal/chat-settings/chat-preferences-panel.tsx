"use client";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import BackgroundMusic from "./background-music";
import UpgradePlan from "./upgrade-plan";
import Voices from "./voices";

type ChatPreferencesPanelProps = {
  className?: string;
  /** Tighter spacing for narrow sidebar vs modal */
  density?: "comfortable" | "compact";
};

export function ChatPreferencesPanel({
  className,
  density = "comfortable",
}: ChatPreferencesPanelProps) {
  const compact = density === "compact";
  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-gutter:stable]",
        compact ? "gap-4 px-0 py-1" : "gap-6 px-5 py-5 sm:px-6 sm:py-6",
        className,
      )}
    >
      <BackgroundMusic />
      <Separator className={compact ? "bg-v3-stroke-weak" : "bg-stroke-neutral-weaker"} />
      <Voices />
      <Separator className={compact ? "bg-v3-stroke-weak" : "bg-stroke-neutral-weaker"} />
      <UpgradePlan />
    </div>
  );
}
