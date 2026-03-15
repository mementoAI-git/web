import { SelectionCard } from "./SelectionCard";
import { AGE_BAND_OPTIONS, MEMENTO_FOR_OPTIONS } from "../types";
import type { AgeBand, MementoFor } from "../types";

export interface IdentityStep2Props {
  ageBand: AgeBand | null;
  onAgeBandSelect: (value: AgeBand) => void;
  whereFrom: string;
  onWhereFromChange: (value: string) => void;
  mementoFor: MementoFor[];
  onMementoForChange: (value: MementoFor[]) => void;
  validationErrors?: { ageBand?: string; mementoFor?: string };
}

export function IdentityStep2({
  ageBand,
  onAgeBandSelect,
  whereFrom,
  onWhereFromChange,
  mementoFor,
  onMementoForChange,
  validationErrors = {},
}: IdentityStep2Props) {
  const toggleMementoFor = (value: MementoFor) => {
    if (mementoFor.includes(value)) {
      onMementoForChange(mementoFor.filter((m) => m !== value));
    } else {
      onMementoForChange([...mementoFor, value]);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-medium text-[#2C1F15]">
          A little about you
        </h2>
        <p className="mt-1 text-sm text-[#7A6A5E]">
          This helps us tailor prompts and suggestions to you.
        </p>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-[#2C1F15]">
          How old are you?
        </p>
        <div className="flex flex-col gap-3">
          {AGE_BAND_OPTIONS.map((opt) => (
            <SelectionCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              icon={opt.icon}
              isSelected={ageBand === opt.value}
              onClick={() => onAgeBandSelect(opt.value)}
            />
          ))}
        </div>
        {validationErrors.ageBand && (
          <p className="mt-1.5 text-[13px] text-[#C8956C]">
            {validationErrors.ageBand}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="onboarding-where-from"
          className="mb-2 block text-sm font-medium text-[#2C1F15]"
        >
          Where are you from? <span className="text-[#B0A098]">(optional)</span>
        </label>
        <input
          id="onboarding-where-from"
          type="text"
          value={whereFrom}
          onChange={(e) => onWhereFromChange(e.target.value)}
          placeholder="City, country — or just the region"
          maxLength={120}
          className="w-full rounded-xl border-[1.5px] border-[#E4D9CC] bg-[#FFFCF8] px-4 py-3 text-[#2C1F15] placeholder:text-[#B0A098] focus:border-[#C8956C] focus:outline-none"
        />
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-[#2C1F15]">
          Who is this Memento mostly for?
        </p>
        <div className="flex flex-col gap-3">
          {MEMENTO_FOR_OPTIONS.map((opt) => (
            <SelectionCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              icon={opt.icon}
              isSelected={mementoFor.includes(opt.value)}
              onClick={() => toggleMementoFor(opt.value)}
            />
          ))}
        </div>
        {validationErrors.mementoFor && (
          <p className="mt-1.5 text-[13px] text-[#C8956C]">
            {validationErrors.mementoFor}
          </p>
        )}
      </div>
    </div>
  );
}
