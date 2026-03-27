import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { cn, isEmpty } from "@/utility";
import { useStore } from "@/hooks/use-store";
import {
  CompassIcon,
  CopyIcon,
  GiftIcon,
  HomeIcon,
  MailIcon,
  PhoneIcon,
  UserIcon,
} from "@/components/icons";
import UpdateTextInput from "./update-text-input";
import { SettingsGeneralFieldRow } from "./settings-general-field-row";
import { formatProfileDobDisplay, InlineProfileDateField } from "./inline-profile-date-field";

type FieldKey =
  | "nickname"
  | "first_name"
  | "last_name"
  | "phone_number"
  | "location"
  | "dob"
  | "country";

export default function General() {
  const { user } = useStore();
  const [editingField, setEditingField] = useState<FieldKey | null>(null);

  const toggle = useCallback((key: FieldKey) => {
    setEditingField((cur) => (cur === key ? null : key));
  }, []);

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
    <div className="flex w-full flex-col">
      <header className="mb-2">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-inter text-base font-bold text-v3-text-strong text-balance">General</span>
          <span className="font-inter text-sm text-v3-text-weak text-pretty">Manage your Memento profile</span>
        </div>
      </header>

      <div className="flex flex-col rounded-lg border border-v3-stroke-weak px-1 sm:px-2">
        <SettingsGeneralFieldRow
          icon={<UserIcon />}
          label="Display name"
          placeholder="Add a display name"
          displayValue={(user?.nickname ?? "").trim()}
          isEditing={editingField === "nickname"}
          onToggleEdit={() => toggle("nickname")}
        >
          <UpdateTextInput label={undefined} aria-label="Display name" name="nickname" placeholder="How we greet you" />
        </SettingsGeneralFieldRow>

        <SettingsGeneralFieldRow
          icon={<MailIcon />}
          label="Email"
          placeholder="No email on file"
          displayValue={user?.email ?? ""}
          valueEmphasis
          showEdit={false}
          isEditing={false}
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

        <SettingsGeneralFieldRow
          icon={<UserIcon />}
          label="First name"
          placeholder="Add a first name"
          displayValue={(user?.first_name ?? "").trim()}
          isEditing={editingField === "first_name"}
          onToggleEdit={() => toggle("first_name")}
        >
          <UpdateTextInput label={undefined} aria-label="First name" name="first_name" />
        </SettingsGeneralFieldRow>

        <SettingsGeneralFieldRow
          icon={<UserIcon />}
          label="Last name"
          placeholder="Add a last name"
          displayValue={(user?.last_name ?? "").trim()}
          isEditing={editingField === "last_name"}
          onToggleEdit={() => toggle("last_name")}
        >
          <UpdateTextInput label={undefined} aria-label="Last name" name="last_name" />
        </SettingsGeneralFieldRow>

        <SettingsGeneralFieldRow
          icon={<PhoneIcon />}
          label="Phone"
          placeholder="Add a phone number"
          displayValue={(user?.phone_number ?? "").trim()}
          isEditing={editingField === "phone_number"}
          onToggleEdit={() => toggle("phone_number")}
        >
          <UpdateTextInput
            label={undefined}
            aria-label="Phone number"
            name="phone_number"
            btnText={isEmpty(user?.phone_number) ? "Add phone" : "Change"}
          />
        </SettingsGeneralFieldRow>

        <SettingsGeneralFieldRow
          icon={<CompassIcon />}
          label="Location"
          placeholder="Add a location"
          displayValue={(user?.location ?? "").trim()}
          isEditing={editingField === "location"}
          onToggleEdit={() => toggle("location")}
        >
          <UpdateTextInput
            label={undefined}
            aria-label="Location"
            name="location"
            btnText={user?.location ? "Change" : "Set location"}
            placeholder="e.g. New York, USA"
          />
        </SettingsGeneralFieldRow>

        <SettingsGeneralFieldRow
          icon={<GiftIcon />}
          label="Birthday"
          placeholder="Add a birthday"
          displayValue={dobDisplay}
          isEditing={editingField === "dob"}
          onToggleEdit={() => toggle("dob")}
        >
          <InlineProfileDateField name="dob" aria-label="Birthday" />
        </SettingsGeneralFieldRow>

        <SettingsGeneralFieldRow
          icon={<HomeIcon />}
          label="Country"
          placeholder="Add a country"
          displayValue={(user?.country ?? "").trim()}
          isEditing={editingField === "country"}
          onToggleEdit={() => toggle("country")}
        >
          <UpdateTextInput
            label={undefined}
            aria-label="Country"
            name="country"
            placeholder="e.g. US"
            btnText={isEmpty(user?.country) ? "Add" : "Update"}
          />
        </SettingsGeneralFieldRow>
      </div>
    </div>
  );
}
