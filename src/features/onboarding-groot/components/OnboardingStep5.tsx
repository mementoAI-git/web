import { getStep5Body } from "../adaptive";
import type { MotivationType } from "../types";

export interface OnboardingStep5Props {
  displayName: string;
  motivationType: MotivationType | null;
  onSecondaryLink: () => void;
}

export function OnboardingStep5({
  displayName,
  motivationType,
  onSecondaryLink,
}: OnboardingStep5Props) {
  const body = getStep5Body(motivationType);

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <h1
        className="font-serif text-[28px] leading-tight text-[#4A3728]"
        style={{ fontFamily: "Lora, serif" }}
      >
        You&apos;re all set, {displayName || "there"}. Let&apos;s begin.
      </h1>
      <p className="text-base text-[#7A6A5E]">{body}</p>
      <button
        type="button"
        onClick={onSecondaryLink}
        className="text-sm text-[#B0A098] hover:text-[#7A6A5E] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8956C] focus-visible:ring-offset-2 rounded"
      >
        Or take me to the dashboard — I&apos;ll explore on my own →
      </button>
    </div>
  );
}
