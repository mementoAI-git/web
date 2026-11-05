import { useRef, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import inviteArtwork from "@/assets/image/invite-friends/friends.webp";

/** Shared illustrated frame for inviting friends and inviting a connection. */
export function InviteDialog({
  title,
  description,
  onClose,
  busy = false,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  busy?: boolean;
  children: ReactNode;
}) {
  const returnFocusRef = useRef(document.activeElement as HTMLElement | null);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        className="block max-h-[calc(100dvh-2rem)] overflow-y-auto p-0 sm:max-w-[432px] motion-reduce:animate-none"
        overlayClassName="bg-overlay-backdrop"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusRef.current?.focus();
        }}
      >
        <div
          aria-hidden="true"
          className="relative h-[63px] overflow-hidden sm:h-[72px]"
        >
          <img
            src={inviteArtwork}
            alt=""
            className="h-full w-full object-cover object-[center_35%]"
          />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-b from-transparent via-popover/70 to-popover" />
        </div>
        <div className="relative space-y-4 px-5 pb-5 sm:px-6">
          <DialogHeader className="items-center text-center">
            <DialogTitle className="font-garamond text-[32px] font-medium leading-10">
              {title}
            </DialogTitle>
            <DialogDescription className="text-center leading-6">
              {description}
            </DialogDescription>
          </DialogHeader>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
