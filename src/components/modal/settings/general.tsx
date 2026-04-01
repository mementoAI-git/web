import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/utility";
import { useStore } from "@/hooks/use-store";
import { CopyIcon } from "@/components/icons";
import { SettingsGeneralFieldCell } from "./settings-general-field-cell";
import { SettingsSectionCard } from "./settings-section-card";
import { formatProfileDobDisplay } from "./inline-profile-date-field";
import { GeneralProfileEditModal } from "./general-profile-edit-modal";
import { SettingsProfileHeader } from "@/pages/dashboard/settings/settings-profile-header";

export default function General() {
  const { user } = useStore();
  const [editOpen, setEditOpen] = useState(false);

  const copyEmail = useCallback(async () => {
    if (!user?.email) return;
    try {
      await navigator.clipboard.writeText(user.email);
      toast.success("Email copied");
    } catch {
      toast.error("Could not copy email");
    }
  }, [user?.email]);

  const dobDisplay = useMemo(() => formatProfileDobDisplay(user?.dob ?? ""), [user?.dob]);

  return (
    <div className="flex w-full flex-col gap-6">
      <SettingsProfileHeader />

      <hr className="border-t border-v3-stroke-weak" />

      <SettingsSectionCard
        title={
          <div className="flex items-center justify-between gap-3">
            <span>Profile details</span>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-8 min-h-8 shrink-0 rounded-full !border !border-v3-stroke-weak bg-white px-3 font-inter text-sm font-semibold text-v3-text-strong",
                "hover:bg-v3-fill-weaker",
              )}
              onClick={() => setEditOpen(true)}
            >
              Edit profile
            </Button>
          </div>
        }
      >
        <div className="grid w-full grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
          <SettingsGeneralFieldCell
            label="Display name"
            placeholder="Add a display name"
            displayValue={(user?.nickname ?? "").trim()}
          />

          <SettingsGeneralFieldCell
            label="Email"
            placeholder="No email on file"
            displayValue={user?.email ?? ""}
            valueEmphasis
            valueAdornment={
              user?.email ? (
                <button
                  type="button"
                  onClick={() => void copyEmail()}
                  className={cn(
                    "inline-flex min-h-8 min-w-8 items-center justify-center rounded-md",
                    "text-v3-fill-strong motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-out",
                    "hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-v3-stroke-strong focus-visible:ring-offset-2",
                  )}
                  aria-label="Copy email address"
                >
                  <CopyIcon className="size-[18px]" aria-hidden />
                </button>
              ) : null
            }
          />

          <SettingsGeneralFieldCell
            label="First name"
            placeholder="Add a first name"
            displayValue={(user?.first_name ?? "").trim()}
          />

          <SettingsGeneralFieldCell
            label="Last name"
            placeholder="Add a last name"
            displayValue={(user?.last_name ?? "").trim()}
          />

          <SettingsGeneralFieldCell
            label="Phone"
            placeholder="Add a phone number"
            displayValue={(user?.phone_number ?? "").trim()}
          />

          <SettingsGeneralFieldCell
            label="Location"
            placeholder="Add a location"
            displayValue={(user?.location ?? "").trim()}
          />

          <SettingsGeneralFieldCell
            label="Birthday"
            placeholder="Add a birthday"
            displayValue={dobDisplay}
          />

          <SettingsGeneralFieldCell
            label="Country"
            placeholder="Add a country"
            displayValue={(user?.country ?? "").trim()}
          />
        </div>
      </SettingsSectionCard>

      <GeneralProfileEditModal open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
