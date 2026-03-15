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
        <h2 className="text-lg font-medium text-[#2C1F15]">
          Your name, your way
        </h2>
        <p className="mt-1 text-sm text-[#7A6A5E]">
          One is for formal contexts — the other is what we&apos;ll use every day.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="onboarding-full-name"
            className="mb-2 block text-sm font-medium text-[#2C1F15]"
          >
            What&apos;s your full name?
          </label>
          <input
            id="onboarding-full-name"
            type="text"
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            placeholder="Used for documents, time capsules..."
            maxLength={80}
            className={cn(
              "w-full rounded-xl border-[1.5px] bg-[#FFFCF8] px-4 py-3 text-[#2C1F15] placeholder:text-[#B0A098] transition-colors",
              "focus:border-[#C8956C] focus:outline-none",
              validationErrors.fullName
                ? "border-[#C8956C]"
                : "border-[#E4D9CC]",
              fullName.trim() &&
                !validationErrors.fullName &&
                "border-[#8BAF8B]"
            )}
          />
          {validationErrors.fullName && (
            <p className="mt-1.5 text-[13px] text-[#C8956C]">
              {validationErrors.fullName}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="onboarding-display-name"
            className="mb-2 block text-sm font-medium text-[#2C1F15]"
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
              "w-full rounded-xl border-[1.5px] bg-[#FFFCF8] px-4 py-3 text-[#2C1F15] placeholder:text-[#B0A098] transition-colors",
              "focus:border-[#C8956C] focus:outline-none",
              validationErrors.displayName
                ? "border-[#C8956C]"
                : "border-[#E4D9CC]",
              displayName.trim() &&
                !validationErrors.displayName &&
                "border-[#8BAF8B]"
            )}
          />
          {validationErrors.displayName && (
            <p className="mt-1.5 text-[13px] text-[#C8956C]">
              {validationErrors.displayName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
