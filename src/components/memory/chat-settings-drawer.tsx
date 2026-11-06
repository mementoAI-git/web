import { useEffect, useRef, useState, type ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bottomSheetClass } from "@/components/ui/bottom-sheet-class";
import { Dialog } from "@/components/ui/dialog";
import { SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useModal } from "@/hooks/use-modal";
import { resolveSidebarDesktopWidthPx } from "./sidebar-desktop-width";

/** The live conversation drawer; one preference tree at either breakpoint. */
export function ChatSettingsDrawer({ isOpen, onClose, children }: {
  isOpen: boolean;
  onClose: () => void;
  children: (mobile: boolean) => ReactNode;
}) {
  const [width, setWidth] = useState(() => window.innerWidth);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const { state: modalStack } = useModal();
  const coveredByModal = modalStack.length > 0;
  const coveredRef = useRef(coveredByModal);
  coveredRef.current = coveredByModal;
  const mobile = width < 768;
  useEffect(() => {
    const resize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const captureFocus = (event: Event) => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body && !active.closest('[role="dialog"]')) {
      triggerRef.current = active;
    }
    event.preventDefault();
    closeRef.current?.focus();
  };

  const closeButton = (
    <div className="absolute right-4 top-4 z-10 md:right-3 md:top-3">
      <DialogPrimitive.Close asChild>
        <Button ref={closeRef} variant="ghost" size="icon-sm" aria-label="Close chat settings" className="rounded-full text-text-neutral-strong">
          <X aria-hidden />
        </Button>
      </DialogPrimitive.Close>
    </div>
  );
  const restoreFocus = (event: Event) => {
    event.preventDefault();
    if (!coveredRef.current && triggerRef.current?.isConnected) triggerRef.current.focus();
  };

  // Global viewers use their own focus trap. Unmount this modal layer immediately
  // so Radix releases aria-hidden, scroll locking and outside-pointer blocking.
  // Keep isOpen intact so closing the viewer returns to chat settings.
  if (coveredByModal) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      {mobile ? (
        <SheetContent
          side="bottom"
          showCloseButton={false}
          aria-describedby={undefined}
          className={bottomSheetClass}
          onOpenAutoFocus={captureFocus}
          onCloseAutoFocus={restoreFocus}
        >
          {closeButton}
          <SheetHeader>
            <SheetTitle>Chat settings</SheetTitle>
          </SheetHeader>
          <div className="px-6">{children(true)}</div>
        </SheetContent>
      ) : (
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[45] bg-overlay-backdrop backdrop-blur-[2px] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 motion-reduce:animate-none" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            onOpenAutoFocus={captureFocus} onCloseAutoFocus={restoreFocus}
            data-testid="memory-sidebar-desktop"
            style={{ width: resolveSidebarDesktopWidthPx(width, { wideChatPanel: true }) }}
            className="fixed top-[6px] right-[6px] bottom-[6px] z-50 flex min-h-0 min-w-0 flex-col items-stretch justify-start overflow-hidden rounded-[24px] bg-bg-neutral-solid shadow-xl outline-none duration-200 data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-right-10 data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-right-10 motion-reduce:animate-none"
          >
            {closeButton}
            <DialogPrimitive.Title className="sr-only">Chat settings</DialogPrimitive.Title>
            {children(false)}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      )}
    </Dialog>
  );
}
