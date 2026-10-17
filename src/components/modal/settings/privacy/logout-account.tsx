import { useRef } from "react";
import { useLogout } from "@/hooks/use-logout";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function LogoutAccount({ close, open }: { close: () => void; open: boolean }) {
  const returnFocusRef = useRef(document.activeElement as HTMLElement | null);
  const { logout, loading } = useLogout();
  const pending = useRef(false);
  const handleLogout = async () => {
    if (pending.current) return;
    pending.current = true;
    try {
      await logout({ allDevices: true });
      toast.success("Logged out of all devices");
    } catch {
      toast.error("Couldn’t finish logging out of all devices. Please retry.");
    } finally {
      pending.current = false;
    }
  };
  return <Dialog open={open} onOpenChange={next => { if (!next && !pending.current) close(); }}>
    <DialogContent showCloseButton={!loading} onCloseAutoFocus={event => {
      event.preventDefault();
      if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
    }}>
      <DialogHeader>
        <DialogTitle>Log out of all devices?</DialogTitle>
        <DialogDescription>You’ll need to sign in again on every device, including this one.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" disabled={loading} onClick={close}>Cancel</Button>
        <Button disabled={loading} onClick={() => void handleLogout()}>{loading ? "Logging out…" : "Log out of all devices"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
