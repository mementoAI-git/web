import { socialPlatforms } from "@/features/profile/social-platforms";
import { useId, useRef, useState } from "react";
import endpoint from "@/api/endpoint";
import { put } from "@/api/mutations";
import { useApi } from "@/hooks/use-api";
import type { IPersona } from "@/utility/interface";
import {
  normalizeSocialProfileUrl,
  type SocialPlatform,
} from "@/features/profile/social-accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { SettingsFieldRow } from "@/pages/dashboard/settings/settings-field-row";

const commonPlatforms: SocialPlatform[] = ["x", "linkedin", "instagram"];

/** Platforms whose profiles are recognized by a short @handle. */
const handleBaseUrls: Partial<Record<SocialPlatform, string>> = {
  x: "https://x.com/",
  instagram: "https://www.instagram.com/",
};

function labelFor(key: SocialPlatform, label: string) {
  return key === "x" ? "X / Twitter" : label;
}

/** Shows a saved profile link as @handle until the field is focused. */
function toDisplayValue(key: SocialPlatform, value: string) {
  if (!handleBaseUrls[key] || !normalizeSocialProfileUrl(key, value)) return value;
  return `@${new URL(value).pathname.replace(/^\/|\/$/g, "")}`;
}

/** Accepts @handle for handle-based platforms. Other values go through URL validation. */
function toProfileUrlInput(key: SocialPlatform, value: string) {
  const base = handleBaseUrls[key];
  return base && /^@?[\w.]+$/.test(value) && !/^https?/i.test(value)
    ? `${base}${value.replace(/^@/, "")}`
    : value;
}

type Draft = Partial<Record<SocialPlatform, string>>;
export function SettingsSocialProfiles() {
  const id = useId();
  const { data, mutate, isLoading } = useApi<IPersona | null>(endpoint.persona);
  const accounts = data?.data?.social_accounts;
  const [draft, setDraft] = useState<Draft>({});
  const [added, setAdded] = useState<SocialPlatform[]>([]);
  const [focused, setFocused] = useState<SocialPlatform | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const savingRef = useRef(false);
  const focusAdded = useRef<SocialPlatform | null>(null);
  const valueFor = (key: SocialPlatform) =>
    draft[key] ?? accounts?.[key]?.url ?? "";
  const hasChanges = socialPlatforms.some(
    ({ key }) => valueFor(key).trim() !== (accounts?.[key]?.url ?? ""),
  );
  const visibleKeys = [
    ...commonPlatforms,
    ...socialPlatforms
      .map(({ key }) => key)
      .filter(
        (key) =>
          !commonPlatforms.includes(key) &&
          (added.includes(key) || accounts?.[key]?.url),
      ),
  ];
  const available = socialPlatforms.filter(
    ({ key }) => !visibleKeys.includes(key),
  );
  const disabled = saving || isLoading || !data;
  const setValue = (key: SocialPlatform, value: string) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setError("");
  };
  const paste = async (key: SocialPlatform) => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (text) {
        setValue(key, text);
        return;
      }
    } catch {
      // Clipboard access can be declined; typing or pasting by keyboard still works.
    }
    document.getElementById(`${id}-${key}`)?.focus();
  };
  const save = async () => {
    if (!hasChanges || isLoading || savingRef.current) return;
    const changes: Partial<Record<SocialPlatform, string | null>> = {};
    for (const { key, label } of socialPlatforms) {
      const value = valueFor(key).trim();
      if (value === (accounts?.[key]?.url ?? "")) continue;
      const url = value
        ? normalizeSocialProfileUrl(key, toProfileUrlInput(key, value))
        : null;
      if (value && !url) {
        setError(`Enter a valid HTTPS ${label} profile URL.`);
        return;
      }
      changes[key] = url;
    }
    if (!Object.keys(changes).length) {
      setDraft({});
      return;
    }
    setSaving(true);
    savingRef.current = true;
    setError("");
    try {
      const result = await put(endpoint.persona, { social_accounts: changes });
      if (result.success === false) throw new Error("Save failed");
      const next = { ...accounts };
      for (const [key, url] of Object.entries(changes))
        next[key as SocialPlatform] = url
          ? { url, source: "user", confirmed_at: new Date().toISOString() }
          : null;
      await mutate(
        (current) => ({
          ...current,
          data: {
            ...current?.data,
            user: current?.data?.user ?? "",
            social_accounts: next,
          },
        }),
        { revalidate: false },
      );
      setDraft({});
      void mutate().catch(() => undefined);
    } catch {
      setError("We couldn’t save your social profiles. Please try again.");
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  };
  return (
    <form
      aria-label="Social profiles"
      aria-busy={saving}
      className="settings-card px-8 py-5"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <fieldset disabled={disabled} className="min-w-0">
        <legend className="sr-only">Social profile links</legend>
        {visibleKeys.map((key) => {
          const { label } = socialPlatforms.find(
            (platform) => platform.key === key,
          )!;
          const value = valueFor(key);
          return (
            <SettingsFieldRow
              key={key}
              htmlFor={`${id}-${key}`}
              label={labelFor(key, label)}
            >
              <Input
                id={`${id}-${key}`}
                maxLength={500}
                inputMode="url"
                className="settings-value-input"
                placeholder={`Paste ${label} link`}
                value={focused === key ? value : toDisplayValue(key, value)}
                onFocus={() => setFocused(key)}
                onBlur={() => setFocused(null)}
                onChange={(event) => setValue(key, event.target.value)}
              />
              {!value ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="settings-pill"
                  aria-label={`Paste ${label} link`}
                  onClick={() => void paste(key)}
                >
                  Paste
                </Button>
              ) : null}
            </SettingsFieldRow>
          );
        })}
      </fieldset>
      <p className="pt-2 text-xs text-text-neutral-weaker">
        Clear a link to remove it. Removed links won’t be added again by AI.
      </p>
      <div className="flex flex-wrap items-center justify-end gap-3 pt-3.5">
        {error && (
          <p role="alert" className="mr-auto text-sm text-text-error-strong">
            {error}
          </p>
        )}
        {available.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                disabled={disabled}
                className="settings-pill h-9 px-4"
              >
                Add new
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="motion-reduce:animate-none"
              onCloseAutoFocus={(event) => {
                if (!focusAdded.current) return;
                event.preventDefault();
                requestAnimationFrame(() => {
                  document
                    .getElementById(`${id}-${focusAdded.current}`)
                    ?.focus();
                  focusAdded.current = null;
                });
              }}
            >
              {available.map(({ key, label }) => (
                <DropdownMenuItem
                  key={key}
                  onSelect={() => {
                    focusAdded.current = key;
                    setAdded((previous) => [...previous, key]);
                  }}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {hasChanges ? (
          <Button
            type="submit"
            variant="ghost"
            disabled={disabled}
            className="settings-pill h-9 px-4"
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
