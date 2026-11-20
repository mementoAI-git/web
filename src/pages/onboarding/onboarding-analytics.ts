import { useEffect } from "react";
import posthog from "@/lib/posthog";

/**
 * Onboarding funnel events. The mobile app sends the same names and step
 * numbers, so one PostHog funnel covers both platforms. Only the step is
 * sent: never answers, nicknames or anything typed.
 */
export const ONBOARDING_STEPS = [
  "welcome",
  "nickname",
  "reasons",
  "about",
  "life_areas",
  "summary",
] as const;
export type OnboardingStepName = (typeof ONBOARDING_STEPS)[number];

let currentStep: OnboardingStepName | null = null;

function stepProps(step: OnboardingStepName) {
  return { step, step_number: ONBOARDING_STEPS.indexOf(step) + 1 };
}

export function trackOnboardingStep(step: OnboardingStepName) {
  // Re-renders and React's development double effects repeat the same step.
  if (step === currentStep) return;
  currentStep = step;
  if (posthog.__loaded) posthog.capture("onboarding_step_viewed", stepProps(step));
}

export function trackOnboardingSkipped() {
  if (posthog.__loaded)
    posthog.capture(
      "onboarding_skipped",
      currentStep ? { from_step: currentStep, step_number: stepProps(currentStep).step_number } : {},
    );
  currentStep = null;
}

/** Call once the completion is saved; the summary page adds its own details. */
export function resetOnboardingTracking() {
  currentStep = null;
}

/** Record the onboarding screen being shown. */
export function useTrackOnboardingStep(step: OnboardingStepName | null) {
  useEffect(() => {
    if (step) trackOnboardingStep(step);
  }, [step]);
}

/** The question page has three steps inside one route. */
export function questionStep(step: number): OnboardingStepName {
  return step === 1 ? "reasons" : step === 2 ? "about" : "life_areas";
}
