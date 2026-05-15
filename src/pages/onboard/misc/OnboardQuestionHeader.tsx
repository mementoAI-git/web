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
  hint: string;
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
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-garamond text-lg sm:text-xl font-normal leading-snug text-v3-text-strong">
          {title}
          {required ? (
            <span className="text-text-info-strong" aria-hidden>
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
              className="h-9 w-9 shrink-0 rounded-full text-v3-text-weak transition-transform duration-150 ease-out active:scale-[0.97] hover:bg-v3-fill-weaker hover:text-v3-text-strong"
              aria-label="Why we ask this"
            >
              <CircleHelp className="h-5 w-5" strokeWidth={1.75} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="max-w-sm border-v3-stroke-weak bg-v3-fill-weaker p-3 text-v3-text-strong shadow-lg"
          >
            <p className="text-sm leading-relaxed text-v3-text-weak">{whyDetail}</p>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="text-sm leading-relaxed text-v3-text-weak">{hint}</p>
    </div>
  );
}
