import { socialPlatforms } from "@/features/profile/social-platforms";
import { useRef, useState } from "react";
import endpoint from "@/api/endpoint";
import { put } from "@/api/mutations";
import { useApi } from "@/hooks/use-api";
import type { IPersona } from "@/utility/interface";
import { SocialProfileLinks } from "@/features/profile/social-profile-links";
import {
  normalizeSocialProfileUrl,
  type SocialPlatform,
} from "@/features/profile/social-accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsSectionCard } from "./settings-section-card";

type Draft = Partial<Record<SocialPlatform, string>>;
export function SettingsSocialProfiles() {
  const { data, mutate } = useApi<IPersona | null>(endpoint.persona);
  const accounts = data?.data?.social_accounts;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [original, setOriginal] = useState<Draft>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const savingRef = useRef(false);
  const edit = () => {
    const values = Object.fromEntries(
      socialPlatforms.map(({ key }) => [key, accounts?.[key]?.url ?? ""]),
    );
    setOriginal(values);
    setDraft(values);
    setError("");
  };
  const save = async () => {
    if (!draft || savingRef.current) return;
    const changes: Partial<Record<SocialPlatform, string | null>> = {};
    for (const { key, label } of socialPlatforms) {
      const value = draft[key]?.trim() ?? "";
      if (value === original[key]) continue;
      const url = value ? normalizeSocialProfileUrl(key, value) : null;
      if (value && !url) {
        setError(`Enter a valid HTTPS ${label} profile URL.`);
        return;
      }
      changes[key] = url;
    }
    if (!Object.keys(changes).length) {
      setDraft(null);
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
      setDraft(null);
      void mutate().catch(() => undefined);
    } catch {
      setError("We couldn’t save your social profiles. Please try again.");
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  };
  return (
    <SettingsSectionCard
      title={
        <div className="flex items-center justify-between gap-3">
          <span>Social profiles</span>
          {!draft && (
            <Button
              variant="secondary"
              className="h-8 rounded-md"
              onClick={edit}
            >
              Edit social profiles
            </Button>
          )}
        </div>
      }
      className="mt-6"
    >
      <p className="font-inter text-sm text-text-neutral-weak">
        Add your official accounts. Memento can also add accounts you explicitly
        identify as yours in stories or conversations.
      </p>
      {draft ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
          className="space-y-4"
        >
          {socialPlatforms.map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-2">
              <label
                htmlFor={`social-${key}`}
                className="font-inter text-sm text-text-neutral-strong"
              >
                {label}
              </label>
              <Input
                id={`social-${key}`}
                type="url"
                maxLength={500}
                placeholder={placeholder}
                value={draft[key] ?? ""}
                disabled={saving}
                onChange={(event) =>
                  setDraft({ ...draft, [key]: event.target.value })
                }
              />
            </div>
          ))}
          <p className="text-xs text-text-neutral-weaker">
            Clear a link to remove it. Removed links won’t be added again by AI.
          </p>
          {error && (
            <p role="alert" className="text-sm text-text-error-strong">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setDraft(null)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save social profiles"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-3">
          {socialPlatforms.some(({ key }) => accounts?.[key]) ? (
            <SocialProfileLinks accounts={accounts} />
          ) : (
            <p className="text-sm text-text-neutral-weaker">
              No social profiles added yet.
            </p>
          )}
        </div>
      )}
    </SettingsSectionCard>
  );
}
