import { useRef, useState } from "react";
import endpoint from "@/api/endpoint";
import useFetcher from "@/hooks/use-fetcher";
import { useLogout } from "@/hooks/use-logout";
import { reportFetcherError } from "@/api/report-fetcher-error";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function DeleteAccount({ close, open }: { close: () => void; open: boolean }) {
  const returnFocusRef = useRef(document.activeElement as HTMLElement | null);
  const { trigger: deleteAccount } = useFetcher(endpoint.deleteAccount, "delete");
  const { logout } = useLogout();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const handleDelete = async () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      const result = await deleteAccount({});
      if (!result?.success) throw new Error(result?.message || "Couldn’t delete your account. Please retry.");
      // Deletion has already revoked access; don't issue another authenticated logout request.
      await logout({ localOnly: true });
    } catch (error) {
      reportFetcherError(error, "Couldn’t delete your account. Please retry.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return <Dialog open={open} onOpenChange={next => { if (!next && !pending.current) close(); }}>
    <DialogContent showCloseButton={!busy} onCloseAutoFocus={event => {
      event.preventDefault();
      if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
    }}>
      <DialogHeader>
        <DialogTitle>Delete your account permanently?</DialogTitle>
        <DialogDescription>Your access ends immediately and deletion cannot be undone. Secure cleanup may finish in the background. Capsules already delivered can remain with their recipients, without a link to your profile.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" disabled={busy} onClick={close}>Cancel</Button>
        <Button variant="destructive" disabled={busy} onClick={() => void handleDelete()}>{busy ? "Deleting…" : "I understand, delete"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
