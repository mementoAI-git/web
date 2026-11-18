import type { AriaRole, MouseEvent, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { dashboardInset } from "@/pages/dashboard/component/dashboard-inset";
import { Button } from "@/components/ui/button";
import { cn } from "@/utility";

type StripBannerProps = {
  children: ReactNode;
  className?: string;
  role?: AriaRole;
  /**
   * The banner's one main action. Clicking anywhere on the surface runs it, as
   * if the banner's link had been clicked. Its own links and buttons keep
   * their behaviour, so keyboard and screen reader users still reach the
   * action through them.
   */
  onActivate?: () => void;
};

/** Clicks on a link, button or field inside the banner are theirs, not the banner's. */
const INTERACTIVE = "a, button, input, select, textarea, [role='button']";

/**
 * Shared dashboard strip banner surface. Neutral tokens keep it adaptive across
 * every theme. It matches the header's z-index and follows it in the DOM, so it
 * paints above the nav blur, while portaled overlays that come later still cover it.
 */
export function StripBanner({
  children,
  className,
  role = "status",
  onActivate,
}: StripBannerProps) {
  const { pathname } = useLocation();
  const handleClick = onActivate
    ? (event: MouseEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement;
        const hit = target.closest(INTERACTIVE);
        if (hit && event.currentTarget.contains(hit)) return;
        onActivate();
      }
    : undefined;
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
          onActivate &&
            "cursor-pointer transition-colors hover:border-stroke-neutral-strong motion-reduce:transition-none",
          className,
        )}
        role={role}
        onClick={handleClick}
      >
        {children}
      </div>
    </div>
  );
}

/** Small desktop button for a banner's main action. Phones tap the banner itself. */
export function StripBannerAction({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="xs"
      className="hidden shrink-0 rounded-full md:inline-flex"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
