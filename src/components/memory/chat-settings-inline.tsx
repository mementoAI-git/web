import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

/** The dashboard's empty third column, beside the header and page rather than below the header. */
export const DASHBOARD_RIGHT_COLUMN_ID = "dashboard-right-column";

/** Chat settings as a full-height column beside the conversation, so the chat stays readable and usable. */
export function ChatSettingsInline({ isOpen, onClose, width, children }: {
  isOpen: boolean;
  onClose: () => void;
  width: number;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(isOpen);
  const [column, setColumn] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => setColumn(document.getElementById(DASHBOARD_RIGHT_COLUMN_ID)), []);

  useEffect(() => {
    if (wasOpen.current === isOpen) return;
    wasOpen.current = isOpen;
    if (isOpen) {
      triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      closeRef.current?.focus({ preventScroll: true });
    } else if (panelRef.current?.contains(document.activeElement) && triggerRef.current?.isConnected) {
      // Only when focus would otherwise be lost: someone typing in the chat keeps their place.
      triggerRef.current.focus({ preventScroll: true });
    }
  }, [isOpen]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && !event.defaultPrevented) onClose();
  };

  const panel = (
    <AnimatePresence initial={false}>
      {isOpen ? (
        <motion.aside
          ref={panelRef}
          aria-label="Chat settings"
          data-testid="chat-settings-inline"
          initial={{ width: 0 }}
          animate={{ width }}
          exit={{ width: 0 }}
          transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 36, mass: 0.8 }}
          onKeyDown={onKeyDown}
          className="relative h-full min-h-0 shrink-0 overflow-hidden rounded-none border-l border-stroke-neutral-weak bg-transparent"
        >
          {/* A fixed width less the 1px border, so the controls slide in rather than reflow as the column opens. */}
          <div className="flex h-full min-h-0 flex-col" style={{ width: width - 1 }}>
            <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-6 pt-4">
              <h2 className="font-rounded text-base font-semibold text-foreground">Chat settings</h2>
              <Button ref={closeRef} variant="ghost" size="icon-sm" aria-label="Close chat settings" onClick={onClose} className="rounded-full text-text-neutral-strong">
                <X aria-hidden />
              </Button>
            </div>
            <div className="min-h-0 flex-1">{children}</div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );

  return column ? createPortal(panel, column) : panel;
}
