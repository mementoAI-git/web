import type { ReactNode } from "react";
import { TypographyH2 } from "@/components/ui/typography";
import { cn } from "@/utility";

/** The section heading style from Overview, for the top of a page. Wrap one word in `em`. */
export function PageHeading({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <TypographyH2
      className={cn(
        "min-w-0 font-garamond text-[28px] font-normal leading-tight text-text-neutral-strong sm:text-[32px] lg:text-[32px] [&_em]:text-text-neutral-weaker",
        className,
      )}
    >
      {children}
    </TypographyH2>
  );
}
