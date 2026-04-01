import { SelectionCard } from "./SelectionCard";
import { ARCHETYPE_OPTIONS } from "../types";
import type { HostArchetype } from "../types";
import { cn } from "@/lib/utils";

export interface OnboardingStep1Props {
  displayName: string;
  onDisplayNameChange: (value: string) => void;
  hostArchetype: HostArchetype | null;
  onArchetypeSelect: (value: HostArchetype) => void;
  hostArchetypeFreetext: string;
  onArchetypeFreetextChange: (value: string) => void;
  validationErrors?: { displayName?: string; archetype?: string };
}

export function OnboardingStep1({
  displayName,
  onDisplayNameChange,
  hostArchetype,
  onArchetypeSelect,
  hostArchetypeFreetext,
  onArchetypeFreetextChange,
  validationErrors = {},
}: OnboardingStep1Props) {
  const showOtherTextarea = hostArchetype === "other";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label htmlFor="onboarding-display-name" className="mb-2 block text-sm font-medium text-v3-text-strong">
          Your name
        </label>
        <input
          id="onboarding-display-name"
          type="text"
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          placeholder="Eleanor, Jamie, Nne, Dad..."
          maxLength={40}
          className={cn(
            "w-full rounded-xl border-[1.5px] bg-v3-fill-weaker px-4 py-3 text-v3-text-strong placeholder:text-v3-text-weaker transition-colors",
            "focus:border-v3-brand-strong focus:outline-none",
            validationErrors.displayName
              ? "border-v3-brand-strong"
              : "border-v3-stroke-weak",
            displayName.trim() && !validationErrors.displayName && "border-stroke-success-strong"
          )}
        />
        {validationErrors.displayName && (
          <p className="mt-1.5 text-[13px] text-v3-brand-strong">
            {validationErrors.displayName}
          </p>
        )}
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-v3-text-strong">
          Which best describes you?
        </p>
        <div className="flex flex-col gap-3">
          {ARCHETYPE_OPTIONS.map((opt) => (
            <SelectionCard
              key={opt.value}
              value={opt.value}
              label={opt.label}
              sublabel={opt.sublabel}
              icon={opt.icon}
              isSelected={hostArchetype === opt.value}
              onClick={() => onArchetypeSelect(opt.value)}
            />
          ))}
        </div>
        {validationErrors.archetype && (
          <p className="mt-1.5 text-[13px] text-v3-brand-strong">
            {validationErrors.archetype}
          </p>
        )}
      </div>

      {showOtherTextarea && (
        <div className="animate-in fade-in duration-200">
          <label htmlFor="onboarding-archetype-freetext" className="mb-2 block text-sm font-medium text-v3-text-strong">
            Tell us a little about why you&apos;re here
          </label>
          <textarea
            id="onboarding-archetype-freetext"
            value={hostArchetypeFreetext}
            onChange={(e) => onArchetypeFreetextChange(e.target.value)}
            placeholder="No pressure — whatever feels right"
            maxLength={280}
            rows={3}
            className="w-full rounded-xl border-[1.5px] border-v3-stroke-weak bg-v3-fill-weaker px-4 py-3 text-v3-text-strong placeholder:text-v3-text-weaker focus:border-v3-brand-strong focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
