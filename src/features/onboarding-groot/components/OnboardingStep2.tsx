import { SelectionCard } from "./SelectionCard";
import { MOTIVATION_OPTIONS } from "../types";
import type { MotivationType } from "../types";

export interface OnboardingStep2Props {
  motivationType: MotivationType | null;
  onMotivationSelect: (value: MotivationType) => void;
  validationErrors?: { motivation?: string };
}

export function OnboardingStep2({
  motivationType,
  onMotivationSelect,
  validationErrors = {},
}: OnboardingStep2Props) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-medium text-v3-text-strong">
          Why are you here?
        </h2>
        <p className="mt-1 text-sm text-v3-text-weak">
          Choose the one that feels most like you.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {MOTIVATION_OPTIONS.map((opt) => (
          <SelectionCard
            key={opt.value}
            value={opt.value}
            label={opt.label}
            sublabel={opt.sublabel}
            icon={opt.icon}
            isSelected={motivationType === opt.value}
            onClick={() => onMotivationSelect(opt.value)}
          />
        ))}
      </div>
      {validationErrors.motivation && (
        <p className="text-[13px] text-v3-brand-strong">
          {validationErrors.motivation}
        </p>
      )}
    </div>
  );
}
