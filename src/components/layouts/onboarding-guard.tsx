"use client";

import { useEffect, type PropsWithChildren } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStore } from "@/hooks/use-store";
import { storageKeys } from "@/utility/constant";

/**
 * Redirects to /onboarding when user has not completed onboarding.
 * Uses user.onboarding_complete from profile when available;
 * falls back to localStorage memento_onboarding_complete when backend doesn't return it.
 */
export default function OnboardingGuard({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useStore();

  useEffect(() => {
    const path = location.pathname;
    if (path === "/onboarding" || path.startsWith("/onboarding")) return;
    if (path === "/onboard" || path.startsWith("/onboard")) return;

    const isCompleteState = user?.onboarding_status === "completed" || user?.onboarded === true;
    const fromStorage = localStorage.getItem(storageKeys.onboardingComplete) === "true";
    const skipped =
      user?.onboarding_status === "skipped" || localStorage.getItem(storageKeys.onboardingSkipped) === "true";

    const isComplete = isCompleteState || fromStorage;
    if (isComplete) return;
    if (skipped) return;

    navigate("/onboard", { replace: true });
  }, [user?.onboarding_status, user?.onboarded, location.pathname, navigate]);

  return <>{children}</>;
}
