import { useId, useRef, useState } from "react";
import { mutate } from "swr";
import { toast } from "sonner";
import endpoint from "@/api/endpoint";
import { put } from "@/api/mutations";
import { useApi } from "@/hooks/use-api";
import { useRequestRecovery } from "@/hooks/use-request-recovery";
import { useStore } from "@/hooks/use-store";
import type { IPersona } from "@/utility/interface";
import { Button } from "@/components/ui/button";
import {
  FormDialog,
  FormDialogField,
  FormDialogFooter,
  FormDialogTextarea,
} from "@/components/modal/form-dialog";

export function SettingsAbout() {
  const id = useId();
  const { user, setUser } = useStore();
  const { data: persona, error: personaError, isValidating: personaValidating, mutate: refreshPersona } = useApi<IPersona | null>(
    endpoint.persona,
  );
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [savedBio, setSavedBio] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const personaReady = persona !== undefined || savedBio !== null;
  const bio = savedBio ?? (persona !== undefined
    ? persona.data?.self_description ?? ""
    : user?.context?.self_description ?? "");
  const retryPersona = useRequestRecovery(
    "settings-about", personaError, refreshPersona,
    "We couldn’t load your introduction. Please try again.",
  );

  const save = async () => {
    if (savingRef.current || !personaReady || draft.trim() === bio.trim()) return;
    savingRef.current = true;
    setSaving(true);
    const self_description = draft.trim();
    try {
      const result = await put(endpoint.persona, { self_description });
      if (result.success === false) throw new Error("Save failed");
      setSavedBio(self_description);
      if (user)
        setUser?.({ ...user, context: { ...user.context, self_description } });
      setEditing(false);
      toast.success("About me updated");
      void refreshPersona().catch(() => undefined);
      void mutate(endpoint.profile).catch(() => undefined);
    } catch {
      toast.error("We couldn’t save your introduction. Please try again.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <>
      <section
        aria-labelledby={`${id}-heading`}
        className="settings-card p-4 sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2
            id={`${id}-heading`}
            className="text-sm font-medium text-text-neutral-strong"
          >
            About me
          </h2>
          <Button
            variant="ghost"
            size="sm"
            disabled={!personaReady}
            className="settings-pill"
            onClick={() => {
              setDraft(bio);
              setEditing(true);
            }}
          >
            Edit
          </Button>
        </div>
        {bio.trim() || personaReady ? (
          <p className="whitespace-pre-wrap text-sm leading-5 text-text-neutral-weak">
            {bio.trim() || "Write a little about yourself, in your own words."}
          </p>
        ) : !personaError ? (
          <p role="status" className="text-sm text-text-neutral-weak">Loading your introduction…</p>
        ) : null}
        {personaError ? (
          <Button variant="outline" className="mt-3" onClick={retryPersona} disabled={personaValidating}>
            {personaValidating ? "Retrying…" : "Retry loading introduction"}
          </Button>
        ) : null}
      </section>
      {editing ? (
        <FormDialog
          title="Edit About me"
          description="Write a little about yourself, in your own words."
          busy={saving}
          onClose={() => setEditing(false)}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
            className="flex flex-col gap-5"
          >
            <FormDialogField label="Your introduction" htmlFor={`${id}-bio`}>
              <FormDialogTextarea
                id={`${id}-bio`}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={500}
                disabled={saving}
                autoFocus
                className="max-h-60 min-h-[188px] overflow-y-auto"
                placeholder="Write a little about yourself…"
              />
            </FormDialogField>
            <FormDialogFooter
              submitLabel="Save changes"
              busyLabel="Saving…"
              busy={saving}
              disabled={draft.trim() === bio.trim()}
              onDismiss={() => setEditing(false)}
            />
          </form>
        </FormDialog>
      ) : null}
    </>
  );
}
