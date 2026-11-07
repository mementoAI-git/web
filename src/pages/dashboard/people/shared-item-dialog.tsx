import { useDialogFocus } from "./use-dialog-focus";
import { useRef, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { useRequestRecovery } from "@/hooks/use-request-recovery";
import DOMPurify from "isomorphic-dompurify";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getSharedItem, removeSharedItem, type Person } from "@/api/people";
import { useStore } from "@/hooks/use-store";
import { useModal } from "@/hooks/use-modal";
import { SharedMedia } from "./shared-media";
export function SharedItemDialog({
  person,
  sourceId,
  onClose,
  onRemoved,
  onTalk,
  confirmRemoval = false,
  sharedChat = false,
}: {
  person: Person;
  sourceId: string;
  onClose: () => void;
  onRemoved: () => void;
  confirmRemoval?: boolean;
  sharedChat?: boolean;
  onTalk?: (id: string, title: string) => void;
}) {
  const restoreFocus = useDialogFocus();
  const { user } = useStore();
  const { open } = useModal();
  const { data, error, isLoading, mutate } = useSWR(
    ["people-item", user?._id, person.user_id, sourceId],
    () => getSharedItem(person.user_id, sourceId),
    {
      shouldRetryOnError: false,
      revalidateOnMount: true,
      refreshInterval: 15000,
    },
  );
  const [confirm, setConfirm] = useState(confirmRemoval);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const retry = useRequestRecovery(
    `shared-item:${person.user_id}:${sourceId}`,
    error,
    mutate,
    "Couldn’t load this shared memory. Try again.",
  );
  const remove = async () => {
    if (busyRef.current || error || !data?.can_remove) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await removeSharedItem(person.user_id, sourceId);
      onRemoved();
      onClose();
    } catch {
      toast.error("Couldn’t remove this memory. Access may have changed.");
      void mutate().catch(() => undefined);
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
        className="people-dialog max-h-[85dvh] overflow-y-auto bg-bg-neutral sm:max-w-2xl"
        overlayClassName="bg-overlay-backdrop dark:bg-overlay-backdrop-dark"
      >
        <DialogHeader>
          <DialogTitle className="font-garamond text-2xl">
            {(!error && data?.title) || "Shared memory"}
          </DialogTitle>
          <DialogDescription>
            {data && !error
              ? `From ${data.contributor.user_id === user?._id ? "you" : data.contributor.name} · ${new Date(data.original_date).toLocaleDateString()}`
              : "Our Space"}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p role="status">Loading shared memory…</p>
        ) : error ? (
          <Button size="form" variant="outline" onClick={retry}>
            Retry loading shared memory
          </Button>
        ) : (
          data && (
            <>
              <div className="whitespace-pre-line text-sm leading-7 text-text-neutral-strong">
                {DOMPurify.sanitize(
                  data.body.replace(/<\/(p|div|li|h[1-6])>|<br\s*\/?>/gi, "\n"),
                  { ALLOWED_TAGS: [], ALLOWED_ATTR: [] },
                )}
              </div>
              <SharedMedia attachments={data.attachments} title={data.title} />
              {data.shared_date && (
                <p className="text-xs text-text-neutral-weak">
                  Shared {new Date(data.shared_date).toLocaleDateString()}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <Button
                  size="form"
                  disabled={busy}
                  variant="outline"
                  onClick={() => {
                    onClose();
                    open("view-memory", { memoryId: sourceId });
                  }}
                >
                  View original memory
                </Button>
                {(sharedChat || person.memento_state === "active") && onTalk && (
                  <Button
                    size="form"
                    disabled={busy}
                    variant="outline"
                    onClick={() => {
                      onClose();
                      onTalk(sourceId, data.title);
                    }}
                  >
                    Talk about this memory
                  </Button>
                )}
                {data.can_remove && (
                  <Button
                    size="form"
                    disabled={busy}
                    variant="ghost"
                    className="text-text-error-strong"
                    onClick={() => setConfirm(true)}
                  >
                    Remove from Our Space
                  </Button>
                )}
              </div>
              {confirm && data.can_remove && (
                <div className="rounded-xl border border-stroke-neutral-weak p-4">
                  <p className="mb-3 text-sm text-text-neutral-weak">
                    Remove this memory from your space with {person.name}? The
                    original stays in your Memento.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      size="form"
                      disabled={busy}
                      onClick={() => void remove()}
                    >
                      {busy ? "Removing…" : "Confirm removal"}
                    </Button>
                    <Button
                      size="form"
                      disabled={busy}
                      variant="ghost"
                      onClick={() => setConfirm(false)}
                    >
                      Keep memory
                    </Button>
                  </div>
                </div>
              )}
            </>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
