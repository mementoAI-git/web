import TimesIcon from "@/public/icon/times.svg";
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

export function ModalCloseBtn({ onClick }) {
  return (
    <div onClick={onClick} className="modal-close-btn">
      <TimesIcon width={8.33} height={8.33} />
    </div>
  )
}
