import { useState } from "react";
import { SelectionCard } from "./SelectionCard";
import { EXPRESSION_OPTIONS } from "../types";
import { getStep4Headline } from "../adaptive";
import type { ExpressionMode, MotivationType } from "../types";

const MAX_SELECTIONS = 2;
const ALL_EXPRESSION_MODES = EXPRESSION_OPTIONS.map((o) => o.value);

export interface OnboardingStep4Props {
  motivationType: MotivationType | null;
  expressionMode: ExpressionMode[];
  onExpressionModeChange: (modes: ExpressionMode[]) => void;
  validationErrors?: { expression?: string };
}

export function OnboardingStep4({
  motivationType,
  expressionMode,
  onExpressionModeChange,
  validationErrors = {},
}: OnboardingStep4Props) {
  const [showMaxTooltip, setShowMaxTooltip] = useState(false);
  const allSelected = expressionMode.length === ALL_EXPRESSION_MODES.length;

  const toggleMode = (value: ExpressionMode) => {
    if (expressionMode.includes(value)) {
      onExpressionModeChange(expressionMode.filter((m) => m !== value));
      setShowMaxTooltip(false);
    } else if (!allSelected && expressionMode.length >= MAX_SELECTIONS) {
      setShowMaxTooltip(true);
      setTimeout(() => setShowMaxTooltip(false), 2000);
    } else {
      onExpressionModeChange([...expressionMode, value]);
    }
  };

  const handleAllClick = () => {
    onExpressionModeChange(allSelected ? [] : [...ALL_EXPRESSION_MODES]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-medium text-[#2C1F15]">
          {getStep4Headline(motivationType)}
        </h2>
        <p className="mt-1 text-sm text-[#7A6A5E]">
          We&apos;ll make sure that&apos;s the easiest way to get started.
        </p>
      </div>

      <div className="relative">
        <div className="flex flex-col gap-3">
          {EXPRESSION_OPTIONS.map((opt) => (
            <SelectionCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              sublabel={opt.sublabel}
              icon={opt.icon}
              isSelected={expressionMode.includes(opt.value)}
              onClick={() => toggleMode(opt.value)}
              disabled={
                !allSelected &&
                !expressionMode.includes(opt.value) &&
                expressionMode.length >= MAX_SELECTIONS
              }
            />
          ))}
          <SelectionCard
            value="__all__"
            label="All of the above"
            sublabel="I like all of these"
            icon="✨"
            isSelected={allSelected}
            onClick={handleAllClick}
          />
        </div>
        {showMaxTooltip && (
          <p
            className="absolute left-0 right-0 top-full mt-2 text-[13px] text-[#C8956C]"
            role="status"
          >
            Pick your top two
          </p>
        )}
      </div>

      {validationErrors.expression && (
        <p className="text-[13px] text-[#C8956C]">
          {validationErrors.expression}
        </p>
      )}
    </div>
  );
}
