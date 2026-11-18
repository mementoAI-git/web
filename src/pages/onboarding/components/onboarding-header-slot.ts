import { createContext } from "react";

/** Header spot where phones show the stepper, beside Skip. Set by the onboarding layout. */
export const OnboardingHeaderSlot = createContext<HTMLElement | null>(null);
