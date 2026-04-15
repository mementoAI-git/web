import { SelectionCard } from "./SelectionCard";
import { PASSION_OPTIONS } from "../types";
import type { PassionKey } from "../types";

export interface IdentityStep3Props {
  passions: PassionKey[];
  onPassionsChange: (value: PassionKey[]) => void;
  passionsFreetext: string;
  onPassionsFreetextChange: (value: string) => void;
  validationErrors?: { passions?: string };
}

export function IdentityStep3({
  passions,
  onPassionsChange,
  passionsFreetext,
  onPassionsFreetextChange,
  validationErrors = {},
}: IdentityStep3Props) {
  const showSomethingElse = passions.includes("something_else");

  const togglePassion = (value: PassionKey) => {
    if (passions.includes(value)) {
      onPassionsChange(passions.filter((p) => p !== value));
    } else {
      onPassionsChange([...passions, value]);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-medium text-v3-text-strong">
          What you love
        </h2>
        <p className="mt-1 text-sm text-v3-text-weak">
          What are some things you&apos;re passionate about or enjoy? We&apos;ll use these to make prompts feel personal.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {PASSION_OPTIONS.map((opt) => (
          <SelectionCard
            key={opt.value}
            value={opt.value}
            label={opt.label}
            icon={opt.icon}
            isSelected={passions.includes(opt.value)}
            onClick={() => togglePassion(opt.value)}
          />
        ))}
      </div>

      {showSomethingElse && (
        <div className="animate-in fade-in duration-200">
          <label
            htmlFor="onboarding-passions-freetext"
            className="mb-2 block text-sm font-medium text-v3-text-strong"
          >
            Tell us more <span className="text-v3-text-weaker">(optional)</span>
          </label>
          <input
            id="onboarding-passions-freetext"
            type="text"
            value={passionsFreetext}
            onChange={(e) => onPassionsFreetextChange(e.target.value)}
            placeholder="e.g. gardening, vintage cars..."
            maxLength={200}
            className="w-full rounded-xl border-[1.5px] border-v3-stroke-weak bg-v3-fill-weaker px-4 py-3 text-v3-text-strong placeholder:text-v3-text-weaker focus:border-v3-brand-strong focus:outline-none"
          />
        </div>
      )}

      {validationErrors.passions && (
        <p className="text-[13px] text-v3-brand-strong">
          {validationErrors.passions}
        </p>
      )}
    </div>
  );
}
