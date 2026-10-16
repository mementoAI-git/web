import { toast } from "sonner";
import { useRequestRecovery } from "@/hooks/use-request-recovery";
import { useDialogFocus } from "./use-dialog-focus";
import { useState, useRef } from "react";
import useSWR, { mutate as mutateCache } from "swr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  getConnectionSettings,
  setRelationshipLabel,
  disconnectPerson,
  getBlockedPeople,
  unblockPerson,
  isPeopleKey,
  isSpaceKey,
  type Person,
} from "@/api/people";
import { useStore } from "@/hooks/use-store";
export function ConnectionSettingsDialog({
  person,
  onClose,
}: {
  person: Person;
  onClose: () => void;
}) {
  const restoreFocus = useDialogFocus();
  const { user } = useStore();
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    ["people-settings", user?._id, person.user_id],
    () => getConnectionSettings(person.user_id),
    { shouldRetryOnError: false },
  );
  const retry = useRequestRecovery(`people-settings:${person.user_id}`, error, mutate, "Couldn’t load connection settings. Please try again.");
  const [draftLabel, setLabel] = useState<string | null>(null);
  const label = draftLabel ?? data?.relationship ?? person.relationship ?? "Connection";
  const [confirm, setConfirm] = useState<"remove" | "block" | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [message, setMessage] = useState("");
  const action = async () => {
    if (busyRef.current || !data || error) return;
    busyRef.current = true;
    setBusy(true);
    setMessage("");
    try {
      if (confirm) {
        await disconnectPerson(person.user_id, confirm === "block");
        await Promise.allSettled([mutateCache(isPeopleKey), mutateCache(isSpaceKey)]);
        onClose();
      } else {
        await setRelationshipLabel(person.user_id, label.trim());
        await mutate((current) => current ? { ...current, relationship: label.trim() } : current, { revalidate: false });
        void Promise.allSettled([mutateCache(isPeopleKey), mutate()]);
        setMessage("Relationship saved.");
      }
    } catch {
      toast.error("Couldn’t save this change. Try again.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(value) => {
        if (!value && !busyRef.current) onClose();
      }}
    >
      <DialogContent
        onCloseAutoFocus={restoreFocus}
        onEscapeKeyDown={(event) => { if (busyRef.current) event.preventDefault(); }}
        onInteractOutside={(event) => { if (busyRef.current) event.preventDefault(); }}
        className="people-dialog max-h-[85dvh] overflow-y-auto bg-bg-neutral sm:max-w-lg"
        overlayClassName="bg-overlay-backdrop dark:bg-overlay-backdrop-dark"
      >
        <DialogHeader>
          <DialogTitle className="font-garamond text-2xl">
            Connection settings
          </DialogTitle>
          <DialogDescription>{person.name}</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p role="status">Loading settings…</p>
        ) : error ? (
          <Button size="form" variant="outline" onClick={retry} disabled={isValidating}>
            Retry loading connection settings
          </Button>
        ) : (
          data && (
            <>
              <div className="space-y-2">
                <Label htmlFor="people-relationship-label">Relationship</Label>
                <Input
                  variant="form"
                  id="people-relationship-label"
                  value={label}
                  maxLength={80}
                  disabled={busy}
                  onChange={(event) => setLabel(event.target.value)}
                />
                <p className="text-xs text-text-neutral-weak">
                  Only visible to you.
                </p>
              </div>
              <Button
                size="form"
                className="justify-self-end"
                disabled={
                  busy ||
                  !label.trim() ||
                  Boolean(confirm) ||
                  label.trim() ===
                    (data.relationship || person.relationship || "Connection")
                }
                onClick={() => void action()}
              >
                {busy ? "Saving…" : "Save"}
              </Button>
              <div className="flex flex-wrap gap-2 border-t border-stroke-neutral-weak pt-4">
                <Button
                  size="form"
                  variant="ghost"
                  className="text-text-error-strong"
                  disabled={busy}
                  onClick={() => setConfirm("remove")}
                >
                  Remove connection
                </Button>
                <Button
                  size="form"
                  variant="ghost"
                  className="text-text-error-strong"
                  disabled={busy}
                  onClick={() => setConfirm("block")}
                >
                  Block person
                </Button>
              </div>
              {confirm && (
                <div className="rounded-xl border border-stroke-neutral-weak p-4">
                  <p className="mb-3 text-sm leading-6 text-text-neutral-weak">
                    {confirm === "block"
                      ? `Block ${person.name}? Your connection will be removed and neither of you can invite or interact with the other through People.`
                      : `Remove your connection with ${person.name}? Our Space and Talk will become unavailable for both of you. Original memories stay with their authors.`}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="form"
                      disabled={busy}
                      onClick={() => void action()}
                    >
                      {busy
                        ? "Removing…"
                        : confirm === "block"
                          ? "Confirm block"
                          : "Confirm removal"}
                    </Button>
                    <Button
                      size="form"
                      disabled={busy}
                      variant="ghost"
                      onClick={() => setConfirm(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
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
export function BlockedPeopleDialog({ onClose }: { onClose: () => void }) {
  const restoreFocus = useDialogFocus();
  const { user } = useStore();
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    ["people-blocked", user?._id],
    getBlockedPeople,
    { shouldRetryOnError: false },
  );
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const retry = useRequestRecovery("people-blocked", error, mutate, "Couldn’t load blocked people. Please try again.");
  const unblock = async (id: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await unblockPerson(id);
      await mutate((current) => current?.filter((person) => person.user_id !== id), { revalidate: false });
      toast.success("Person unblocked.");
      void mutate().catch(() => undefined);
    } catch {
      toast.error("Couldn’t unblock this person. Try again.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(value) => {
        if (!value && !busyRef.current) onClose();
      }}
    >
      <DialogContent
        onCloseAutoFocus={restoreFocus}
        onEscapeKeyDown={(event) => { if (busyRef.current) event.preventDefault(); }}
        onInteractOutside={(event) => { if (busyRef.current) event.preventDefault(); }}
        className="people-dialog bg-bg-neutral"
        overlayClassName="bg-overlay-backdrop dark:bg-overlay-backdrop-dark"
      >
        <DialogHeader>
          <DialogTitle>Blocked people</DialogTitle>
          <DialogDescription>
            You’ll need a new invitation to reconnect after unblocking.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p role="status">Loading blocked people…</p>
        ) : error && !data ? null : !data?.length ? (
          <p className="text-sm text-text-neutral-weak">
            You haven’t blocked anyone.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.map((person) => (
              <li
                key={person.user_id}
                className="flex items-center justify-between gap-3"
              >
                <span className="truncate text-sm">{person.name}</span>
                <Button
                  size="form"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void unblock(person.user_id)}
                >
                  Unblock
                </Button>
              </li>
            ))}
          </ul>
        )}
        {error && <Button variant="outline" onClick={retry} disabled={isValidating || busy}>Retry loading blocked people</Button>}
      </DialogContent>
    </Dialog>
  );
}
