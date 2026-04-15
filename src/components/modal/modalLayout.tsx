import { TimesIcon } from "@/components/icons";
import { cn, isEmpty } from "@/utility";
import type { PropsWithChildren, ReactNode } from "react";

interface ModalLayoutProps extends PropsWithChildren {
  open: boolean;
  onClose: () => void;
}

export default function ModalLayout({
  open,
  children,
  onClose,
}: ModalLayoutProps) {
  return (
    <div
      className={`modal-overlay z-50 bg-overlay-backdrop ${open ? "flex" : "hidden"}`}
    >
      <div className="modal-container">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-10 top-10 flex aspect-square w-9 items-center justify-center rounded-full bg-grey-400"
        >
          <TimesIcon width={8.33} height={8.33} />
        </button>
        {children}
      </div>
    </div>
  );
}

interface ModalWrapperProps extends PropsWithChildren {
  isMobile?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
}

export function ModalWrapper({
  isMobile = false,
  header,
  footer,
  children,
  onClose,
}: ModalWrapperProps) {
  if (isMobile) {
    return (
      <div className="modal-full-screen">
        {header && (
          <div className="modal-header">
            <div className="flex items-center justify-between">
              {header}
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-grey-400"
                >
                  <TimesIcon width={8.33} height={8.33} />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    );
  }

  return (
    <div className="modal-container">
      {onClose && <ModalCloseBtn onClick={onClose} />}
      {children}
      {footer}
    </div>
  );
}

interface FullScreenModalProps extends PropsWithChildren {
  open: boolean;
  onClose: () => void;
  header?: ReactNode;
  footer?: ReactNode;
}

export function FullScreenModal({
  open,
  onClose,
  header,
  footer,
  children,
}: FullScreenModalProps) {
  return (
    <div
      className={`modal-overlay z-50 bg-overlay-backdrop ${open ? "flex" : "hidden"}`}
    >
      <div className="modal-full-screen">
        {header && (
          <div className="modal-header">
            <div className="flex items-center justify-between">
              {header}
              <button
                type="button"
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-full bg-grey-400"
              >
                <TimesIcon width={8.33} height={8.33} />
              </button>
            </div>
          </div>
        )}

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

interface ModalCloseBtnProps {
  onClick?: () => void;
  className?: string;
}

export function ModalCloseBtn({ onClick, className = "" }: ModalCloseBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("modal-close-btn", { [className]: !isEmpty(className) })}
    >
      <TimesIcon width={8.33} height={8.33} />
    </button>
  );
}
