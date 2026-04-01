"use client";

import {
  useState,
  useEffect,
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
    <div className="flex min-h-0 w-full flex-1 flex-col bg-white">
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

export default function ChatSettings({ children }: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const trigger = isValidElement(children)
    ? cloneElement(children as ReactElement<{ onClick?: (e: MouseEvent) => void }>, {
        onClick: (e: MouseEvent) => {
          (children as ReactElement<{ onClick?: (e: MouseEvent) => void }>).props.onClick?.(e);
          setIsOpen(true);
        },
      })
    : children;

  return (
    <>
      {trigger}
      {isOpen && (
        <div>
          <div className="block sm:hidden">
            <Sheet
              detent="content"
              className="block sm:hidden"
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
            >
              <Sheet.Container className="bg-white">
                <Sheet.Header className="rounded-3xl bg-white" />
                <Sheet.Content className="flex max-h-[min(90dvh,calc(100dvh-24px))] min-h-0 flex-col overflow-y-auto overscroll-contain bg-white">
                  <Content onClose={() => setIsOpen(false)} />
                </Sheet.Content>
              </Sheet.Container>
              <Sheet.Backdrop onTap={() => setIsOpen(false)} />
            </Sheet>
          </div>
          {createPortal(
            <>
              <div
                className="fixed inset-0 z-[125] hidden bg-overlay-backdrop sm:block"
                aria-hidden
                onClick={() => setIsOpen(false)}
              />
              <div
                className="fixed top-1.5 right-1.5 bottom-1.5 z-[130] hidden w-full max-w-[442px] min-h-0 flex-col overflow-hidden rounded-[24px] border border-stroke-neutral-weaker bg-white shadow-2xl sm:flex sm:max-h-[calc(100dvh-12px)]"
                role="dialog"
                aria-modal="true"
                aria-label="Chat settings"
                onClick={(e) => e.stopPropagation()}
              >
                <Content onClose={() => setIsOpen(false)} />
              </div>
            </>,
            document.body,
          )}
        </div>
      )}
    </>
  );
}
