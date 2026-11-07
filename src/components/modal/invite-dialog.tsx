import { useRef, type ReactNode, type RefObject } from "react";
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
  initialFocusRef,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  busy?: boolean;
  /** Takes focus on open instead of the first field. */
  initialFocusRef?: RefObject<HTMLElement | null>;
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
        className="block max-h-[calc(100dvh-2rem)] overflow-y-auto p-0 sm:max-w-[358px] motion-reduce:animate-none [&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:bg-popover [&_[data-slot=dialog-close]]:text-text-neutral-strong"
        overlayClassName="bg-overlay-backdrop"
        onOpenAutoFocus={
          initialFocusRef
            ? (event) => {
                event.preventDefault();
                const target = initialFocusRef.current;
                // Still loading: hold focus on the dialog until the target can take it.
                if (target && !target.matches(":disabled")) target.focus();
                else (event.currentTarget as HTMLElement | null)?.focus();
              }
            : undefined
        }
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusRef.current?.focus();
        }}
      >
        {/* Same size as the voice picker on desktop. Phones use the shared bottom sheet height. */}
        <div className="flex min-h-[min(524px,92dvh)] flex-col sm:min-h-[min(480px,calc(100dvh-2rem))]">
        <div
          aria-hidden="true"
          className="relative min-h-[63px] flex-1 overflow-hidden sm:min-h-[72px]"
        >
          <img
            src={inviteArtwork}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_35%]"
          />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-b from-transparent via-popover/70 to-popover" />
        </div>
        <div className="relative shrink-0 space-y-4 px-5 pb-5 sm:px-6">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
