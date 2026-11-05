import type { AriaRole, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { dashboardInset } from "@/pages/dashboard/component/dashboard-inset";
import { cn } from "@/utility";

type StripBannerProps = {
  children: ReactNode;
  className?: string;
  role?: AriaRole;
};

/**
 * Shared dashboard strip banner surface. Neutral tokens keep it adaptive across
 * every theme. It matches the header's z-index and follows it in the DOM, so it
 * paints above the nav blur, while portaled overlays that come later still cover it.
 */
export function StripBanner({
  children,
  className,
  role = "status",
}: StripBannerProps) {
  const { pathname } = useLocation();
  return (
    <div
      className={cn(
        "relative z-[45] w-full min-w-0 shrink-0 pb-3",
        dashboardInset(pathname),
      )}
    >
      <div
        className={cn(
          "w-full rounded-xl border border-stroke-neutral-weak bg-fill-neutral-weak text-text-neutral-strong",
          className,
        )}
        role={role}
      >
        {children}
      </div>
    </div>
  );
}
