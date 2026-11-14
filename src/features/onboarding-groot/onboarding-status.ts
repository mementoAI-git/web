import type { IUser } from "@/utility/interface";

type OnboardingUser = Pick<IUser, "onboarding_status" | "onboarded"> | null | undefined;

/** True once the account has finished onboarding; skipping does not count. */
export function isOnboardingComplete(user: OnboardingUser): boolean {
  return user?.onboarding_status === "completed" || user?.onboarded === true;
}
