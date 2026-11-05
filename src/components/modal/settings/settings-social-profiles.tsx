import { socialPlatforms } from "@/features/profile/social-platforms";
import { useId, useRef, useState } from "react";
import endpoint from "@/api/endpoint";
import { put } from "@/api/mutations";
import { useApi } from "@/hooks/use-api";
import type { IPersona } from "@/utility/interface";
import { Plus } from "lucide-react";
import {
  normalizeSocialProfileUrl,
  type SocialPlatform,
} from "@/features/profile/social-accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const commonPlatforms: SocialPlatform[] = [
  "x",
  "facebook",
  "linkedin",
  "instagram",
];

type Draft = Partial<Record<SocialPlatform, string>>;
export function SettingsSocialProfiles() {
  const id = useId();
  const { data, mutate, isLoading } = useApi<IPersona | null>(endpoint.persona);
  const accounts = data?.data?.social_accounts;
  const [draft, setDraft] = useState<Draft>({});
  const [added, setAdded] = useState<SocialPlatform[]>([]);
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
  const save = async () => {
    if (!hasChanges || isLoading || savingRef.current) return;
    const changes: Partial<Record<SocialPlatform, string | null>> = {};
    for (const { key, label } of socialPlatforms) {
      const value = valueFor(key).trim();
      if (value === (accounts?.[key]?.url ?? "")) continue;
      const url = value ? normalizeSocialProfileUrl(key, value) : null;
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
    <Card className="sky-card mt-6 gap-0 rounded-3xl border border-stroke-neutral-weak bg-fill-neutral-weak py-0 ring-0">
      <div className="px-6 py-5">
        <h2
          id={`${id}-heading`}
          className="text-sm font-semibold text-text-neutral-strong"
        >
          Social profiles
        </h2>
      </div>
      <form
        aria-labelledby={`${id}-heading`}
        aria-busy={saving}
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <fieldset disabled={saving || isLoading || !data} className="min-w-0">
          <legend className="sr-only">Social profile links</legend>
          {visibleKeys.map((key) => {
            const { label, placeholder } = socialPlatforms.find(
              (platform) => platform.key === key,
            )!;
            return (
              <div
                key={key}
                className="grid min-w-0 gap-2 px-6 py-4 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-6"
              >
                <Label
                  htmlFor={`${id}-${key}`}
                  className="text-sm font-medium text-text-neutral-strong sm:pt-3"
                >
                  {key === "x" ? "Twitter / X" : label}
                </Label>
                <Input
                  id={`${id}-${key}`}
                  type="url"
                  maxLength={500}
                  variant="form"
                  className="min-w-0 bg-transparent motion-reduce:transition-none"
                  placeholder={placeholder}
                  value={valueFor(key)}
                  onChange={(event) => {
                    setDraft((previous) => ({
                      ...previous,
                      [key]: event.target.value,
                    }));
                    setError("");
                  }}
                />
              </div>
            );
          })}
          {available.length > 0 && (
            <div className="px-6 py-4 sm:pl-[208px]">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving || isLoading || !data}
                    className="gap-2"
                  >
                    <Plus className="size-4" aria-hidden />
                    Add social profile
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
            </div>
          )}
        </fieldset>
        <p className="px-6 pt-2 text-xs text-text-neutral-weaker">
          Clear a link to remove it. Removed links won’t be added again by AI.
        </p>
        <div className="flex flex-wrap items-center justify-end gap-4 px-6 py-4">
          {error && (
            <p role="alert" className="mr-auto text-sm text-text-error-strong">
              {error}
            </p>
          )}
          <Button
            type="submit"
            size="form"
            disabled={saving || isLoading || !data || !hasChanges}
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
