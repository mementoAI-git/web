import TimesIcon from "@/public/icon/times.svg";
import { cn, isEmpty } from "@/utility";
import { PropsWithChildren } from "react";

interface IModalLayout extends PropsWithChildren {
  open: boolean;
  onClose: () => void;
}

export default function ModalLayout({ open, children, onClose }: IModalLayout) {
  return (
    <div
      className={`modal-overlay z-50 bg-[rgba(94,94,94,0.5)] ${open ? "flex" : "hidden"} `}
    >
      <div className="modal-container">
        <div
          onClick={onClose}
          className="absolute top-10 right-10 flex aspect-square w-9 cursor-pointer items-center justify-center rounded-full bg-grey-400"
        >
          <TimesIcon width={8.33} height={8.33} />
        </div>
        {children}
      </div>
    </div>
  );
}

interface IModalWrapper extends PropsWithChildren {
  isMobile?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
}

export function ModalWrapper({ isMobile = false, header, footer, children, onClose }: IModalWrapper) {
  if (isMobile) {
    return (
      <div className="modal-full-screen">
        {header && (
          <div className="modal-header">
            <div className="flex items-center justify-between">
              {header}
              {onClose && (
                <div
                  onClick={onClose}
                  className="flex shrink-0 aspect-square w-8 cursor-pointer items-center justify-center rounded-full bg-grey-400"
                >
                  <TimesIcon width={8.33} height={8.33} />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="modal-body">
          {children}
        </div>

        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
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

interface IFullScreenModal extends PropsWithChildren {
  open: boolean;
  onClose: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function FullScreenModal({ open, onClose, header, footer, children }: IFullScreenModal) {
  return (
    <div
      className={`modal-overlay z-50 bg-[rgba(94,94,94,0.5)] ${open ? "flex" : "hidden"}`}
    >
      <div className="modal-full-screen">
        {header && (
          <div className="modal-header">
            <div className="flex items-center justify-between">
              {header}
              <div
                onClick={onClose}
                className="flex aspect-square w-8 cursor-pointer items-center justify-center rounded-full bg-grey-400"
              >
                <TimesIcon width={8.33} height={8.33} />
              </div>
            </div>
          </div>
        )}

        <div className="modal-body">
          {children}
        </div>

        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ModalCloseBtn({ onClick, className = "" }) {
  return (
    <div
      onClick={onClick}
      className={cn("modal-close-btn", { [className]: !isEmpty(className) })}
    >
      <TimesIcon width={8.33} height={8.33} />
    </div>
  );
}
