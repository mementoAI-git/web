import { useId, useRef, useState, type FormEvent } from "react";
import dayjs from "dayjs";
import { mutate } from "swr";
import { toast } from "sonner";
import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/spinner";
import { SettingsFieldRow } from "@/pages/dashboard/settings/settings-field-row";

type FieldKey =
  | "name"
  | "nickname"
  | "dob"
  | "email"
  | "phone_number"
  | "location";

type Field = {
  key: FieldKey;
  label: string;
  placeholder?: string;
  type?: string;
  autoComplete: string;
  readOnly?: boolean;
};

const sections: { label: string; fields: Field[] }[] = [
  {
    label: "Your name and birthday",
    fields: [
      { key: "name", label: "Name", placeholder: "Your name", autoComplete: "name" },
      {
        key: "nickname",
        label: "Display name",
        placeholder: "How we greet you",
        autoComplete: "nickname",
      },
      { key: "dob", label: "Birthday", type: "date", autoComplete: "bday" },
    ],
  },
  {
    label: "Your contact details",
    fields: [
      {
        key: "email",
        label: "Email address",
        type: "email",
        autoComplete: "email",
        readOnly: true,
      },
      {
        key: "phone_number",
        label: "Phone number",
        type: "tel",
        placeholder: "Enter phone number",
        autoComplete: "tel",
      },
      {
        key: "location",
        label: "Location",
        placeholder: "e.g. New York, USA",
        autoComplete: "address-level2",
      },
    ],
  },
];

function normalizeDate(value: string) {
  return value && dayjs(value).isValid()
    ? dayjs(value).format("YYYY-MM-DD")
    : "";
}

function ProfileSection({ label, fields }: { label: string; fields: Field[] }) {
  const id = useId();
  const { user, setUser } = useStore();
  const { trigger, isMutating } = useFetcher(endpoint.profile, "put");
  // Only retain edited fields: background profile refreshes can update untouched fields.
  const [edits, setEdits] = useState<Partial<Record<FieldKey, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const saving = useRef(false);
  const fullName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ");

  const savedValue = (key: FieldKey) => {
    if (key === "name") return fullName;
    const value = String(user?.[key] ?? "");
    return key === "dob" ? normalizeDate(value) : value;
  };
  const payload: Record<string, string> = {};
  for (const key of Object.keys(edits) as FieldKey[]) {
    const value = edits[key]!.trim();
    if (value === savedValue(key).trim()) continue;
    if (key === "name") {
      const [first = "", ...rest] = value.split(/\s+/);
      payload.first_name = first;
      payload.last_name = rest.join(" ");
    } else {
      payload[key] = value;
    }
  }
  const hasChanges = Object.keys(payload).length > 0;
  const nameCleared = edits.name !== undefined && !edits.name.trim();

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !hasChanges || nameCleared || saving.current) return;
    saving.current = true;
    setError(null);
    try {
      const result = await trigger(payload);
      if (!result?.success) {
        setError(
          result?.message || "Could not save your profile. Please try again.",
        );
        return;
      }
      setUser?.({ ...user, ...payload });
      setEdits({});
      toast.success(result.message || "Profile updated");
      void mutate(endpoint.profile).catch(() => undefined);
    } catch {
      setError("Could not save your profile. Please try again.");
    } finally {
      saving.current = false;
    }
  };

  return (
    <form
      aria-label={label}
      onSubmit={save}
      aria-busy={isMutating}
      className="settings-card p-4 sm:p-6"
    >
      <fieldset disabled={!user || isMutating} className="min-w-0">
        <legend className="sr-only">{label}</legend>
        {fields.map((field) => {
          const value = field.readOnly
            ? savedValue(field.key)
            : (edits[field.key] ?? savedValue(field.key));
          const inputId = `${id}-${field.key}`;
          return (
            <SettingsFieldRow
              key={field.key}
              htmlFor={inputId}
              label={field.label}
            >
              <Input
                id={inputId}
                name={field.key}
                type={field.type ?? "text"}
                autoComplete={field.autoComplete}
                placeholder={field.placeholder}
                className="settings-value-input"
                data-empty={value ? undefined : ""}
                readOnly={field.readOnly}
                value={value}
                onChange={(event) => {
                  if (field.readOnly) return;
                  setEdits((previous) => ({
                    ...previous,
                    [field.key]: event.target.value,
                  }));
                  setError(null);
                }}
              />
              {!value && !field.readOnly ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="settings-pill"
                  aria-label={`Add ${field.label.toLowerCase()}`}
                  onClick={() => {
                    const input = document.getElementById(
                      inputId,
                    ) as HTMLInputElement | null;
                    input?.focus();
                    if (field.type === "date") input?.showPicker?.();
                  }}
                >
                  Add
                </Button>
              ) : null}
            </SettingsFieldRow>
          );
        })}
      </fieldset>
      <div className="flex flex-wrap items-center justify-end gap-4 pt-3.5">
        {error && (
          <p role="alert" className="mr-auto text-sm text-text-error-strong">
            {error}
          </p>
        )}
        <Button
          type="submit"
          variant="ghost"
          className="settings-pill h-9 px-4"
          disabled={!user || !hasChanges || nameCleared || isMutating}
        >
          {isMutating && (
            <span aria-hidden="true">
              <Spinner loading className="!size-4" />
            </span>
          )}
          {isMutating ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

export function GeneralProfileForm() {
  return (
    <>
      {sections.map((section) => (
        <ProfileSection
          key={section.label}
          label={section.label}
          fields={section.fields}
        />
      ))}
    </>
  );
}
