"use client";

import {
  useState,
  useEffect,
  useCallback,
  type PropsWithChildren,
  isValidElement,
  cloneElement,
  type ReactElement,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { Sheet } from "react-modal-sheet";
import { TimesIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ChatPreferencesPanel } from "./chat-preferences-panel";

function Content({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-bg-neutral-solid">
      <div className="flex shrink-0 items-center justify-between border-b border-stroke-neutral-weaker px-5 py-4 sm:px-6 sm:py-5">
        <h2 className="font-garamond text-xl font-medium text-text-neutral-strong sm:text-2xl">
          Chat settings
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="shrink-0 rounded-full text-text-neutral-strong hover:bg-fill-neutral-weaker"
          aria-label="Close chat settings"
        >
          <TimesIcon width={12} height={12} aria-hidden />
        </Button>
      </div>
      <ChatPreferencesPanel density="comfortable" className="min-h-0 flex-1" />
    </div>
  );
}

type ChatSettingsProps = PropsWithChildren & {
  /** Fires when the sheet / side panel opens or closes (e.g. to hide the trigger in voice mode). */
  onOpenChange?: (open: boolean) => void;
};

export default function ChatSettings({ children, onOpenChange }: ChatSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateOpen = useCallback(
    (next: boolean) => {
      setIsOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") updateOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, updateOpen]);

  const trigger = isValidElement(children)
    ? cloneElement(children as ReactElement<{ onClick?: (e: MouseEvent) => void }>, {
        onClick: (e: MouseEvent) => {
          (children as ReactElement<{ onClick?: (e: MouseEvent) => void }>).props.onClick?.(e);
          updateOpen(true);
        },
      })
    : children;

  return (
    <>
      {trigger}
      {isOpen && (
        <div>
          {/* Full-screen stacking wrapper so the sheet stacks above voice mode (z-200). */}
          <div className="fixed inset-0 z-[210] block sm:hidden">
            <Sheet
              detent="content"
              className="block h-full sm:hidden"
              isOpen={isOpen}
              onClose={() => updateOpen(false)}
              snapPoints={[0, 0.8]}
              initialSnap={1}
            >
              <Sheet.Container className="max-h-[80dvh] overflow-hidden bg-bg-neutral-solid">
                <Sheet.Header className="rounded-3xl bg-bg-neutral-solid" />
                <Sheet.Content className="flex max-h-[80dvh] min-h-0 flex-col overflow-y-auto overscroll-contain bg-bg-neutral-solid">
                  <Content onClose={() => updateOpen(false)} />
                </Sheet.Content>
              </Sheet.Container>
              <Sheet.Backdrop onTap={() => updateOpen(false)} />
            </Sheet>
          </div>
          {createPortal(
            <>
              <div
                className="fixed inset-0 z-[210] hidden bg-overlay-backdrop sm:block"
                aria-hidden
                onClick={() => updateOpen(false)}
              />
              <div
                className="fixed top-1.5 right-1.5 bottom-1.5 z-[220] hidden w-full max-w-[442px] min-h-0 flex-col overflow-hidden rounded-[var(--radius-modal)] border border-stroke-neutral-weaker bg-bg-neutral-solid shadow-2xl sm:flex sm:max-h-[calc(100dvh-12px)]"
                role="dialog"
                aria-modal="true"
                aria-label="Chat settings"
                onClick={(e) => e.stopPropagation()}
              >
                <Content onClose={() => updateOpen(false)} />
              </div>
            </>,
            document.body,
          )}
        </div>
      )}
    </>
  );
}
