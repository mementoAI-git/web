import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { dashboardInset } from "@/pages/dashboard/component/dashboard-inset";
import { cn } from "@/utility";

export function StripBannerFrame({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div
      className={cn("w-full min-w-0 shrink-0 pb-3", dashboardInset(pathname))}
    >
      {children}
    </div>
  );
}
