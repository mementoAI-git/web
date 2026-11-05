import { useId, useRef, useState, type FormEvent } from "react";
import dayjs from "dayjs";
import { mutate } from "swr";
import { toast } from "sonner";
import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { useStore } from "@/hooks/use-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyIcon } from "@/components/icons";
import Spinner from "@/components/spinner";

const fields = [
  {
    key: "nickname",
    label: "Display name",
    placeholder: "How we greet you",
    autoComplete: "nickname",
  },
  { key: "email", label: "Email", type: "email", autoComplete: "email" },
  { key: "first_name", label: "First name", autoComplete: "given-name" },
  { key: "last_name", label: "Last name", autoComplete: "family-name" },
  { key: "phone_number", label: "Phone", type: "tel", autoComplete: "tel" },
  {
    key: "location",
    label: "Location",
    placeholder: "e.g. New York, USA",
    autoComplete: "address-level2",
  },
  { key: "dob", label: "Birthday", type: "date", autoComplete: "bday" },
  {
    key: "country",
    label: "Country",
    placeholder: "e.g. US",
    autoComplete: "country-name",
  },
] as const;

const fieldRows = [
  [fields[0]],
  [fields[1]],
  [fields[2], fields[3]],
  ...fields.slice(4).map((field) => [field]),
];

type EditableField = Exclude<(typeof fields)[number]["key"], "email">;
type ProfileEdits = Partial<Record<EditableField, string>>;

function normalizeDate(value: string) {
  return value && dayjs(value).isValid()
    ? dayjs(value).format("YYYY-MM-DD")
    : "";
}

export function GeneralProfileForm() {
  const id = useId();
  const { user, setUser } = useStore();
  const { trigger, isMutating } = useFetcher(endpoint.profile, "put");
  // Only retain edited fields: background profile refreshes can update untouched fields.
  const [edits, setEdits] = useState<ProfileEdits>({});
  const [error, setError] = useState<string | null>(null);
  const saving = useRef(false);

  const savedValue = (key: (typeof fields)[number]["key"]) => {
    const value = String(user?.[key] ?? "");
    return key === "dob" ? normalizeDate(value) : value;
  };
  const payload: ProfileEdits = {};
  for (const key of Object.keys(edits) as EditableField[]) {
    const value = edits[key]!.trim();
    if (value !== savedValue(key).trim()) payload[key] = value;
  }
  const hasChanges = Object.keys(payload).length > 0;

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !hasChanges || saving.current) return;
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

  const copyEmail = async () => {
    if (!user?.email) return;
    try {
      await navigator.clipboard.writeText(user.email);
      toast.success("Email copied");
    } catch {
      toast.error("Could not copy email");
    }
  };

  return (
    <Card className="sky-card gap-0 rounded-3xl border border-stroke-neutral-weak bg-fill-neutral-weak py-0 ring-0">
      <h2
        id={`${id}-heading`}
        className="px-6 py-5 text-sm font-semibold text-text-neutral-strong"
      >
        Profile details
      </h2>
      <form
        aria-labelledby={`${id}-heading`}
        onSubmit={save}
        aria-busy={isMutating}
      >
        <fieldset disabled={!user || isMutating} className="min-w-0">
          <legend className="sr-only">Profile fields</legend>
          {fieldRows.map((row) => (
            <div
              key={row[0].key}
              className="grid min-w-0 gap-1.5 px-6 py-2 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-4"
            >
              {row.length > 1 ? (
                <span className="text-sm font-medium text-text-neutral-strong sm:pt-3">
                  First and last name
                </span>
              ) : (
                <Label
                  htmlFor={`${id}-${row[0].key}`}
                  className="text-sm font-medium text-text-neutral-strong sm:pt-3"
                >
                  {row[0].label}
                </Label>
              )}
              <div
                className={
                  row.length > 1 ? "grid min-w-0 grid-cols-2 gap-3" : "min-w-0"
                }
              >
                {row.map((field) => (
                  <div
                    key={field.key}
                    className="flex min-w-0 items-center gap-2"
                  >
                    {row.length > 1 && (
                      <Label className="sr-only" htmlFor={`${id}-${field.key}`}>
                        {field.label}
                      </Label>
                    )}
                    <Input
                      id={`${id}-${field.key}`}
                      name={field.key}
                      type={"type" in field ? field.type : "text"}
                      autoComplete={field.autoComplete}
                      placeholder={
                        "placeholder" in field ? field.placeholder : field.label
                      }
                      variant="form"
                      className="bg-transparent motion-reduce:transition-none"
                      readOnly={field.key === "email"}
                      value={
                        field.key === "email"
                          ? savedValue(field.key)
                          : (edits[field.key] ?? savedValue(field.key))
                      }
                      onChange={(event) => {
                        const key = field.key;
                        if (key === "email") return;
                        setEdits((previous) => ({
                          ...previous,
                          [key]: event.target.value,
                        }));
                        setError(null);
                      }}
                    />
                    {field.key === "email" && user?.email && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Copy email address"
                        onClick={() => void copyEmail()}
                      >
                        <CopyIcon className="size-[18px]" aria-hidden />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </fieldset>
        <div className="flex flex-wrap items-center justify-end gap-4 px-6 py-4">
          {error && (
            <p role="alert" className="mr-auto text-sm text-text-error-strong">
              {error}
            </p>
          )}
          <Button
            type="submit"
            size="form"
            disabled={!user || !hasChanges || isMutating}
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
    </Card>
  );
}
