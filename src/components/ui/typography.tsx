import * as React from "react";
import { cn } from "@/lib/utils";

type TypographyProps = React.HTMLAttributes<HTMLElement>;

export function TypographyH1({ className, ...props }: TypographyProps) {
  return (
    <h1
      className={cn("scroll-m-20 text-3xl font-semibold tracking-tight lg:text-4xl", className)}
      {...props}
    />
  );
}

export function TypographyH2({ className, ...props }: TypographyProps) {
  return (
    <h2
      className={cn("scroll-m-20 text-2xl font-semibold tracking-tight lg:text-3xl", className)}
      {...props}
    />
  );
}

export function TypographyLead({ className, ...props }: TypographyProps) {
  return <p className={cn("text-base text-muted-foreground", className)} {...props} />;
}

export function TypographyMuted({ className, ...props }: TypographyProps) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
