"use client";

import { useEffect, type PropsWithChildren } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStore } from "@/hooks/use-store";

/**
 * Redirects to /onboarding when user has not completed onboarding.
 * Uses the API user.onboarding_status flag.
 */
export default function OnboardingGuard({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useStore();

  useEffect(() => {
    if (!user) return;

    const path = location.pathname;
    if (path === "/onboarding" || path.startsWith("/onboarding")) return;
    if (path === "/onboard" || path.startsWith("/onboard")) return;

    const isComplete = user.onboarding_status === "completed" || user.onboarded === true;
    const skipped = user.onboarding_status === "skipped";

    if (isComplete) return;
    if (skipped) return;

    navigate("/onboard", { replace: true });
  }, [user?.onboarding_status, user?.onboarded, location.pathname, navigate]);

  return <>{children}</>;
}
