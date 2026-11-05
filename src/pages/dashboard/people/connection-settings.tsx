import { toast } from "sonner";
import { useRequestRecovery } from "@/hooks/use-request-recovery";
import { useDialogFocus } from "./use-dialog-focus";
import { useState, useRef, useEffect } from "react";
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
import { UserAvatar } from "@/components/user-avatar";
import { type GroupSearchResultItem } from "@/components/modal/beneficiary/add-beneficiary/select-group";
import { ConnectionGroupPicker } from "./connection-group-picker";
import { fileUploadFetcher } from "@/api/fetcher";
import endpoint from "@/api/endpoint";
import {
  getConnectionSettings,
  setRelationshipLabel,
  disconnectPerson,
  getBlockedPeople,
  unblockPerson,
  isPeopleKey,
  isSpaceKey,
  type Person,
  type ConnectionMetadata,
  type ConnectionAccessScope,
} from "@/api/people";
import { useStore } from "@/hooks/use-store";

const accessOptions: { value: ConnectionAccessScope; label: string }[] = [
  { value: "shared_only", label: "Shared memories only" },
  { value: "full_vault", label: "Full vault" },
  { value: "memories_only", label: "Memories only" },
  { value: "capsules_only", label: "Time capsules only" },
  { value: "documents_only", label: "Documents only" },
];
const isRelationshipCache = (key: unknown) =>
  isPeopleKey(key) ||
  isSpaceKey(key) ||
  (typeof key === "string" &&
    (key.startsWith("/beneficiaries") || key.startsWith("/groups"))) ||
  (Array.isArray(key) &&
    ["people-settings", "people-talk"].includes(String(key[0])));

export function ConnectionSettingsDialog({
  person,
  onClose,
  initialAction,
}: {
  person: Person;
  initialAction?: "remove";
  onClose: () => void;
}) {
  const restoreFocus = useDialogFocus();
  const { user } = useStore();
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    initialAction ? null : ["people-settings", user?._id, person.user_id],
    () => getConnectionSettings(person.user_id),
    { shouldRetryOnError: false },
  );
  const retry = useRequestRecovery(
    `people-settings:${person.user_id}`,
    error,
    mutate,
    "Couldn’t load connection settings. Please try again.",
  );
  const [draftName, setName] = useState<string | null>(null);
  const [draftLabel, setLabel] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const [groups, setGroups] = useState<GroupSearchResultItem[] | null>(null);
  const [scope, setScope] = useState<ConnectionAccessScope | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>();
  const uploadedPhoto = useRef<{ file: File; id: string } | null>(null);
  useEffect(() => {
    if (!photo) {
      setPhotoUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  const savedName = draftName ?? data?.display_name ?? person.name;
  const label =
    draftLabel ?? data?.relationship ?? person.relationship ?? "Connection";
  const [confirm, setConfirm] = useState<"remove" | null>(
    initialAction ?? null,
  );
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [message, setMessage] = useState("");
  const changed =
    savedName.trim() !== (data?.display_name || person.name) ||
    label.trim() !==
      (data?.relationship || person.relationship || "Connection") ||
    groups !== null ||
    scope !== null ||
    photo !== null;
  const action = async () => {
    if (busyRef.current || (!confirm && (!data || error))) return;
    busyRef.current = true;
    setBusy(true);
    setMessage("");
    try {
      if (confirm) {
        await disconnectPerson(person.user_id, false);
        void mutateCache(isRelationshipCache);
        toast.success("Connection removed.");
        onClose();
      } else {
        const metadata: ConnectionMetadata = {};
        if (groups !== null)
          metadata.group_ids = groups.map((group) => group.id);
        if (scope !== null) metadata.access_scope = scope;
        if (photo) {
          if (uploadedPhoto.current?.file !== photo) {
            const result = await fileUploadFetcher(endpoint.upload, {
              arg: { file: photo },
            });
            const file = Array.isArray(result?.data)
              ? result.data[0]
              : result?.data;
            if (result?.success === false || !file?._id)
              throw new Error("Photo upload failed");
            uploadedPhoto.current = { file: photo, id: file._id };
          }
          metadata.avatar_file_id = uploadedPhoto.current.id;
        }
        await setRelationshipLabel(
          person.user_id,
          label.trim(),
          savedName.trim() !== (data?.display_name || person.name)
            ? savedName.trim()
            : undefined,
          metadata,
        );
        await mutate(
          (current) =>
            current
              ? {
                  ...current,
                  display_name: savedName.trim(),
                  relationship: label.trim(),
                  ...(groups !== null ? { groups } : {}),
                  ...(scope !== null ? { access_scope: scope } : {}),
                }
              : current,
          { revalidate: false },
        );
        void mutateCache(isRelationshipCache);
        toast.success("Connection saved.");
        onClose();
      }
    } catch {
      toast.error(
        confirm
          ? "Couldn’t remove this connection. Try again."
          : "Couldn’t save this change. Try again.",
      );
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
        onEscapeKeyDown={(event) => {
          if (busyRef.current) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (busyRef.current) event.preventDefault();
        }}
        className="people-dialog flex max-h-[90dvh] flex-col gap-6 overflow-hidden rounded-3xl bg-bg-raised p-6 font-geist text-text-neutral-strong shadow-2xl ring-1 ring-stroke-neutral-weak sm:max-w-[456px]"
        overlayClassName="bg-overlay-backdrop dark:bg-overlay-backdrop-dark"
      >
        <DialogHeader className="shrink-0 gap-1 pr-10">
          <DialogTitle className="font-geist text-xl font-semibold leading-7">
            {confirm ? "Remove connection" : "Connection settings"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Edit how you’ve saved this connection.
          </DialogDescription>
        </DialogHeader>
        {confirm ? (
          <>
            <p className="text-sm leading-6 text-text-neutral-weak">
              {`Remove your connection with ${person.name}? Your shared space and conversations with each other’s Memento will become unavailable. Original memories stay with their authors.`}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => (initialAction ? onClose() : setConfirm(null))}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={busy}
                onClick={() => void action()}
              >
                {busy ? "Removing…" : "Confirm removal"}
              </Button>
            </div>
          </>
        ) : isLoading ? (
          <p role="status">Loading settings…</p>
        ) : error ? (
          <Button variant="outline" onClick={retry} disabled={isValidating}>
            Retry loading connection settings
          </Button>
        ) : (
          data && (
            <>
              <div className="flex shrink-0 items-center gap-4 rounded-xl bg-fill-neutral-weak p-6">
                <button
                  type="button"
                  aria-label="Edit photo"
                  disabled={busy}
                  onClick={() => photoInput.current?.click()}
                  className="people-control shrink-0 rounded-full hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
                >
                  <UserAvatar
                    size="lg"
                    name={savedName}
                    userId={person.user_id}
                    src={photoUrl || data.avatar_url || person.avatar_url}
                  />
                </button>
                <input
                  ref={photoInput}
                  hidden
                  aria-label="Saved photo"
                  type="file"
                  accept="image/*"
                  disabled={busy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (!file.type.startsWith("image/")) {
                      toast.error("Choose a photo.");
                      return;
                    }
                    setPhoto(file);
                  }}
                />
                <div className="min-w-0 flex-1">
                  <Input
                    aria-label="Saved display name"
                    value={savedName}
                    maxLength={100}
                    disabled={busy}
                    onChange={(event) => setName(event.target.value)}
                    className="h-10 border-transparent bg-transparent px-0 text-lg font-semibold shadow-none hover:border-stroke-neutral-weak focus-visible:px-2"
                  />
                  <div className="space-y-1 text-sm text-text-neutral-weak">
                    {data.email && <p className="truncate">{data.email}</p>}
                    <p>
                      {Number.isSafeInteger(data.shared_item_count) &&
                      data.shared_item_count >= 0
                        ? `${data.shared_item_count} ${data.shared_item_count === 1 ? "memory" : "memories"} captured`
                        : "Memories unavailable"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="-mx-1 flex min-h-0 flex-col gap-4 overflow-y-auto px-1">
                <div className="space-y-2">
                  <Label htmlFor="people-relationship-label">
                    Relationship
                  </Label>
                  <Input
                    variant="form"
                    className="h-10"
                    id="people-relationship-label"
                    value={label}
                    maxLength={80}
                    disabled={busy}
                    onChange={(event) => setLabel(event.target.value)}
                  />
                </div>
                <ConnectionGroupPicker
                  value={groups ?? data.groups ?? []}
                  onChange={setGroups}
                  disabled={busy}
                />
                <div className="space-y-2">
                  <Label htmlFor="people-access">
                    Access to your shared content
                  </Label>
                  <select
                    id="people-access"
                    className="h-10 w-full rounded-lg border border-stroke-neutral-weak bg-bg-raised px-3 text-sm"
                    disabled={busy}
                    value={scope ?? data.access_scope ?? "shared_only"}
                    onChange={(event) =>
                      setScope(event.target.value as ConnectionAccessScope)
                    }
                  >
                    {accessOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 rounded-lg border-stroke-error-strong/20 px-3 text-sm text-text-error-strong hover:bg-fill-error-weak hover:text-text-error-strong"
                  disabled={busy}
                  onClick={() => setConfirm("remove")}
                >
                  Remove connection
                </Button>
                <Button
                  className="ml-auto h-10 rounded-lg px-[18px] text-sm font-bold"
                  disabled={
                    busy || !savedName.trim() || !label.trim() || !changed
                  }
                  onClick={() => void action()}
                >
                  {busy ? "Saving…" : "Save"}
                </Button>
              </div>
              {message && <p role="status">{message}</p>}
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
  const retry = useRequestRecovery(
    "people-blocked",
    error,
    mutate,
    "Couldn’t load blocked people. Please try again.",
  );
  const unblock = async (id: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await unblockPerson(id);
      await mutate(
        (current) => current?.filter((person) => person.user_id !== id),
        { revalidate: false },
      );
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
        onEscapeKeyDown={(event) => {
          if (busyRef.current) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (busyRef.current) event.preventDefault();
        }}
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
        {error && (
          <Button
            variant="outline"
            onClick={retry}
            disabled={isValidating || busy}
          >
            Retry loading blocked people
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
