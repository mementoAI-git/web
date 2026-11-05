import { useRef, useState } from "react";
import { Sparkles } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { SettingsSectionCard } from "./settings-section-card";

export function SettingsAbout() {
  const { user, setUser } = useStore();
  const { data: persona, error: personaError, isValidating: personaValidating, mutate: refreshPersona } = useApi<IPersona | null>(
    endpoint.persona,
  );
  const {
    data: summary,
    error: summaryError,
    isLoading: summaryLoading,
    isValidating: summaryValidating,
    mutate: refreshSummary,
  } = useApi<{ summary: string | null }>(endpoint.personaMemoryInsightsSummary);
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
  const retrySummary = useRequestRecovery(
    "settings-ai-summary", summaryError, refreshSummary,
    "We couldn’t load your AI summary. Please try again.",
  );
  const aiSummary = summary?.data?.summary?.trim();
  // Keep this preview short; the full narrative remains available in Insights.
  const shortSummary =
    aiSummary
      ?.split(/\n\s*\n/)[0]
      ?.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)
      ?.slice(0, 2)
      .join("")
      .trim() || aiSummary;

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
      void refreshSummary().catch(() => undefined);
    } catch {
      toast.error("We couldn’t save your introduction. Please try again.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Dialog
        open={editing}
        onOpenChange={(open) => {
          if (!savingRef.current && (!open || personaReady)) setEditing(open);
        }}
      >
        <section
          aria-labelledby="settings-about-heading"
          className="sky-card rounded-3xl border border-v3-stroke-weak bg-fill-neutral-weak p-6"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2
              id="settings-about-heading"
              className="font-inter text-sm font-semibold text-text-neutral-strong"
            >
              About me
            </h2>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                disabled={!personaReady}
                className="h-8 rounded-md border-stroke-neutral-weak bg-fill-neutral-weak text-text-neutral-strong shadow-none hover:bg-fill-neutral-weak/80 hover:text-text-neutral-strong"
                onClick={() => {
                  if (!personaReady) return;
                  setDraft(bio);
                  setEditing(true);
                }}
              >
                Edit
              </Button>
            </DialogTrigger>
          </div>
          {bio.trim() || personaReady ? (
            <p className="whitespace-pre-wrap font-inter text-sm leading-relaxed text-text-neutral-weak">
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
        <DialogContent
          onEscapeKeyDown={(event) => { if (savingRef.current) event.preventDefault(); }}
          onInteractOutside={(event) => { if (savingRef.current) event.preventDefault(); }}
          overlayClassName="motion-reduce:animate-none"
          className="motion-reduce:animate-none min-h-[min(356px,calc(100dvh_-_2rem))] max-h-[min(480px,calc(100dvh_-_2rem))] overflow-y-auto bg-bg-neutral text-text-neutral-strong">
          <DialogHeader>
            <DialogTitle>Edit About me</DialogTitle>
            <DialogDescription className="text-text-neutral-weak">
              Write a little about yourself, in your own words.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
            className="space-y-4"
          >
            <label htmlFor="settings-bio" className="sr-only">
              Your introduction
            </label>
            <Textarea
              id="settings-bio"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={500}
              disabled={saving}
              autoFocus
              className="max-h-60 min-h-[188px] resize-none overflow-y-auto border-stroke-neutral-weak bg-transparent text-text-neutral-strong placeholder:text-text-neutral-weaker focus-visible:border-stroke-neutral-weak focus-visible:ring-0"
              placeholder="Write a little about yourself…"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || draft.trim() === bio.trim()}
              >
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <SettingsSectionCard
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="size-4" aria-hidden />
            AI summary
          </span>
        }
      >
        {shortSummary ? (
          <p className="whitespace-pre-wrap font-inter text-sm leading-relaxed text-text-neutral-weak">
            {shortSummary}
          </p>
        ) : summaryLoading ? (
          <p role="status" className="text-sm text-text-neutral-weak">
            Loading your summary…
          </p>
        ) : summaryError ? null : (
          <p className="font-inter text-sm leading-relaxed text-text-neutral-weak">
            Your AI summary will appear here as Memento learns more about you
            through your stories and conversations.
          </p>
        )}
        {summaryError ? (
          <Button variant="outline" className="mt-3" onClick={retrySummary} disabled={summaryValidating}>
            {summaryValidating ? "Retrying…" : "Retry loading summary"}
          </Button>
        ) : null}
      </SettingsSectionCard>
    </div>
  );
}
