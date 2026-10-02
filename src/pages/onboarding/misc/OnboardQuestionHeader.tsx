"use client";

import type { ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface OnboardQuestionHeaderProps {
  title: ReactNode;
  /** Short line always visible (trust). */
  hint?: string;
  /** Longer explanation in “Why?” menu. */
  whyDetail: string;
  required?: boolean;
  className?: string;
}

/**
 * Title row + optional “Why?” — rare-flow pattern: light menu, `ease-out` via dropdown primitives.
 */
export function OnboardQuestionHeader({
  title,
  hint,
  whyDetail,
  required,
  className,
}: OnboardQuestionHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <p className="font-garamond text-[22px] font-normal leading-[1.25] text-text-neutral-strong sm:text-[24px]">
          {title}
          {required ? (
            <span className="text-v3-brand-strong" aria-hidden>
              *
            </span>
          ) : null}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-0.5 h-9 w-9 shrink-0 self-start rounded-full text-text-neutral-weak transition-transform duration-150 ease-out active:scale-[0.97] hover:bg-bg-neutral-weak hover:text-text-neutral-strong"
              aria-label="Why we ask this"
            >
              <CircleHelp className="h-5 w-5" strokeWidth={1.75} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="max-w-sm border border-stroke-neutral-weak bg-bg-neutral p-3 text-text-neutral-strong shadow-lg"
          >
            <p className="text-[14px] leading-relaxed text-text-neutral-weak">{whyDetail}</p>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {hint ? (
        <p className="font-inter text-sm leading-6 text-text-neutral-weak">{hint}</p>
      ) : null}
    </div>
  );
}
