import { SelectionCard } from "./SelectionCard";
import { LIFE_CONTEXT_OPTIONS } from "../types";
import type { LifeContextKey } from "../types";

const NONE_KEY: LifeContextKey = "none_of_these";

export interface IdentityStep4Props {
  lifeContext: LifeContextKey[];
  onLifeContextChange: (value: LifeContextKey[]) => void;
  validationErrors?: { lifeContext?: string };
}

export function IdentityStep4({
  lifeContext,
  onLifeContextChange,
  validationErrors = {},
}: IdentityStep4Props) {
  const hasNone = lifeContext.includes(NONE_KEY);

  const toggleContext = (value: LifeContextKey) => {
    if (value === NONE_KEY) {
      onLifeContextChange(hasNone ? [] : [NONE_KEY]);
    } else {
      if (lifeContext.includes(value)) {
        onLifeContextChange(lifeContext.filter((c) => c !== value));
      } else {
        onLifeContextChange([...lifeContext.filter((c) => c !== NONE_KEY), value]);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-medium text-v3-text-strong">
          Your life right now
        </h2>
        <p className="mt-1 text-sm text-v3-text-weak">
          Which of these feel true for you today? This helps us understand where you are — not just where you&apos;ve been.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {LIFE_CONTEXT_OPTIONS.map((opt) => (
          <SelectionCard
            key={opt.value}
            value={opt.value}
            label={opt.label}
            icon={opt.icon}
            isSelected={lifeContext.includes(opt.value)}
            onClick={() => toggleContext(opt.value)}
          />
        ))}
      </div>

      {validationErrors.lifeContext && (
        <p className="text-[13px] text-v3-brand-strong">
          {validationErrors.lifeContext}
        </p>
      )}
    </div>
  );
}
