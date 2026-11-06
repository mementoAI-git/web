import { cn } from "@/lib/utils";

export interface IdentityStep1Props {
  fullName: string;
  onFullNameChange: (value: string) => void;
  displayName: string;
  onDisplayNameChange: (value: string) => void;
  validationErrors?: { fullName?: string; displayName?: string };
}

export function IdentityStep1({
  fullName,
  onFullNameChange,
  displayName,
  onDisplayNameChange,
  validationErrors = {},
}: IdentityStep1Props) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-medium text-v3-text-strong">
          Your name, your way
        </h2>
        <p className="mt-1 text-sm text-v3-text-weak">
          One is for formal contexts — the other is what we&apos;ll use every day.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="onboarding-full-name"
            className="mb-2 block text-sm font-medium text-v3-text-strong"
          >
            What&apos;s your full name?
          </label>
          <input
            id="onboarding-full-name"
            type="text"
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            placeholder="Used for documents..."
            maxLength={80}
            className={cn(
              "w-full rounded-xl border-[1.5px] bg-v3-fill-weaker px-4 py-3 text-v3-text-strong placeholder:text-v3-text-weaker transition-colors",
              "focus:border-v3-brand-strong focus:outline-none",
              validationErrors.fullName
                ? "border-v3-brand-strong"
                : "border-v3-stroke-weak",
              fullName.trim() &&
                !validationErrors.fullName &&
                "border-stroke-success-strong"
            )}
          />
          {validationErrors.fullName && (
            <p className="mt-1.5 text-[13px] text-v3-brand-strong">
              {validationErrors.fullName}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="onboarding-display-name"
            className="mb-2 block text-sm font-medium text-v3-text-strong"
          >
            What do people closest to you call you?
          </label>
          <input
            id="onboarding-display-name"
            type="text"
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            placeholder="The nickname we&apos;ll use in the app"
            maxLength={40}
            className={cn(
              "w-full rounded-xl border-[1.5px] bg-v3-fill-weaker px-4 py-3 text-v3-text-strong placeholder:text-v3-text-weaker transition-colors",
              "focus:border-v3-brand-strong focus:outline-none",
              validationErrors.displayName
                ? "border-v3-brand-strong"
                : "border-v3-stroke-weak",
              displayName.trim() &&
                !validationErrors.displayName &&
                "border-stroke-success-strong"
            )}
          />
          {validationErrors.displayName && (
            <p className="mt-1.5 text-[13px] text-v3-brand-strong">
              {validationErrors.displayName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
