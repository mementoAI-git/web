import { useState } from "react";
import useSWR, { mutate as mutateCache } from "swr";
import { useDialogFocus } from "./use-dialog-focus";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getActivation, updateActivation, isPeopleKey } from "@/api/people";
import { useStore } from "@/hooks/use-store";
import { get } from "@/api/mutations";
import endpoint from "@/api/endpoint";
import type { IPersona } from "@/utility/interface";

export function ActivationDialog({ onClose }: { onClose: () => void }) {
  const restoreFocus = useDialogFocus();
  const { user } = useStore();
  const { data, error, isLoading, mutate } = useSWR(
    ["people-activation", user?._id],
    getActivation,
    { shouldRetryOnError: false },
  );
  const { data: profile, isLoading: preparing } = useSWR(
    user?._id &&
      data &&
      !data.approved_context &&
      !user.context?.self_description
      ? ["people-profile-introduction", user._id]
      : null,
    () => get<IPersona | null>(endpoint.persona, { skipErrorHandling: true }),
    { shouldRetryOnError: false, revalidateOnFocus: false },
  );
  const [draft, setDraft] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ");
  // Prepare an owner-only draft from their existing profile. Never save it on load.
  // Do not pull in personal chats, inferred persona notes, or private memories.
  const introduction = (
    user?.context?.self_description || profile?.data?.self_description
  )
    ?.trim()
    .split(/\n\s*\n/)[0];
  const suggested = (
    introduction ||
    (name
      ? `My name is ${name}.`
      : "My Memento reflects the memories I choose to share.")
  ).slice(0, 6000);
  const context = draft ?? (data?.approved_context || suggested);
  const active = data?.state === "active";
  const save = async (enable: boolean) => {
    setBusy(true);
    setMessage("");
    try {
      const updated = await updateActivation(context.trim(), enable);
      await mutate(updated, false);
      setDraft(null);
      setEditing(false);
      await mutateCache(isPeopleKey);
      setMessage(
        enable
          ? "Your Memento is available to connections."
          : "Your Memento is private.",
      );
    } catch {
      setMessage("Couldn’t save this change. Try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        onCloseAutoFocus={restoreFocus}
        className="people-dialog max-h-[85dvh] overflow-y-auto sm:max-w-lg"
        overlayClassName="bg-overlay-backdrop dark:bg-overlay-backdrop-dark"
      >
        <DialogHeader>
          <DialogTitle className="font-garamond text-2xl">
            Your Memento
          </DialogTitle>
          <DialogDescription>
            {active
              ? "Your connections can talk with your Memento."
              : "Let your connections talk with your Memento."}
          </DialogDescription>
        </DialogHeader>
        {isLoading || preparing ? (
          <p role="status">Loading…</p>
        ) : error ? (
          <div role="alert">
            <p>Couldn’t load your Memento settings.</p>
            <Button size="form" variant="outline" onClick={() => void mutate()}>
              Try again
            </Button>
          </div>
        ) : (
          data && (
            <>
              <section
                className="space-y-3"
                aria-label="Introduction for connections"
              >
                <div className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor={editing ? "people-approved-context" : undefined}
                  >
                    Your introduction
                  </Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-lg"
                    disabled={busy}
                    onClick={() => setEditing(!editing)}
                    aria-expanded={editing}
                  >
                    {editing ? "Preview" : "Edit"}
                  </Button>
                </div>
                {editing ? (
                  <Textarea
                    id="people-approved-context"
                    value={context}
                    onChange={(event) => setDraft(event.target.value)}
                    maxLength={6000}
                    className="min-h-28 rounded-lg"
                    disabled={busy}
                    autoFocus
                  />
                ) : (
                  <p className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border border-stroke-neutral-weak bg-bg-neutral-weaker p-4 text-sm leading-6 text-text-neutral-strong">
                    {context}
                  </p>
                )}
                {!data.approved_context && (
                  <p className="text-xs text-text-neutral-weak">
                    {introduction
                      ? "Prepared from your profile. Review it before enabling."
                      : "Ready to use. You can add more whenever you like."}
                  </p>
                )}
              </section>
              <details className="text-sm text-text-neutral-weak">
                <summary className="cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                  What can my Memento share?
                </summary>
                <p className="mt-2 leading-6">
                  This introduction and memories shared with each connection.
                  Your other memories and personal chats stay private. Their
                  conversations with your Memento stay private to them.
                </p>
              </details>
              <DialogFooter>
                {active ? (
                  <>
                    <Button
                      size="form"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void save(false)}
                    >
                      Make private
                    </Button>
                    <Button
                      size="form"
                      disabled={
                        busy ||
                        !context.trim() ||
                        context.trim() === data.approved_context
                      }
                      onClick={() => void save(true)}
                    >
                      {busy ? "Saving…" : "Save changes"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="form"
                      variant="ghost"
                      disabled={busy}
                      onClick={onClose}
                    >
                      Not now
                    </Button>
                    <Button
                      size="form"
                      disabled={busy || !context.trim()}
                      onClick={() => void save(true)}
                    >
                      {busy ? "Enabling…" : "Enable Memento"}
                    </Button>
                  </>
                )}
              </DialogFooter>
              {message && (
                <p role="status" className="text-sm text-text-neutral-weak">
                  {message}
                </p>
              )}
            </>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
