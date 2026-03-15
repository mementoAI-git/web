import { SelectionCard } from "./SelectionCard";
import { DIMENSION_OPTIONS } from "../types";
import type { DimensionKey } from "../types";

const ALL_DIMENSION_KEYS = DIMENSION_OPTIONS.map((o) => o.value);

export interface OnboardingStep3Props {
  priorityDimensions: DimensionKey[];
  onDimensionsChange: (dimensions: DimensionKey[]) => void;
  validationErrors?: { dimensions?: string };
}

export function OnboardingStep3({
  priorityDimensions,
  onDimensionsChange,
  validationErrors = {},
}: OnboardingStep3Props) {
  const allSelected = priorityDimensions.length === ALL_DIMENSION_KEYS.length;

  const toggleDimension = (value: DimensionKey) => {
    if (priorityDimensions.includes(value)) {
      onDimensionsChange(priorityDimensions.filter((d) => d !== value));
    } else {
      onDimensionsChange([...priorityDimensions, value]);
    }
  };

  const handleAllClick = () => {
    onDimensionsChange(allSelected ? [] : [...ALL_DIMENSION_KEYS]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-medium text-[#2C1F15]">
          What matters most?
        </h2>
        <p className="mt-1 text-sm text-[#7A6A5E]">
          Select the life dimensions you&apos;d like to capture. You can pick as many as resonate with you.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {DIMENSION_OPTIONS.map((opt) => (
          <SelectionCard
            key={opt.value}
            value={opt.value}
            label={opt.label}
            sublabel={opt.sublabel}
            icon={opt.icon}
            isSelected={priorityDimensions.includes(opt.value)}
            onClick={() => toggleDimension(opt.value)}
          />
        ))}
        <SelectionCard
          value="__all__"
          label="All of the above"
          sublabel="I want to capture everything"
          icon="✨"
          isSelected={allSelected}
          onClick={handleAllClick}
        />
      </div>
      {validationErrors.dimensions && (
        <p className="text-[13px] text-[#C8956C]">
          {validationErrors.dimensions}
        </p>
      )}
    </div>
  );
}
