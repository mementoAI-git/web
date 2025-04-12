
import TimesIcon from "@/public/icon/times.svg"
import { PropsWithChildren } from "react"

interface IModalLayout extends PropsWithChildren {
  open: boolean
  onClose: () => any
}

export default function ModalLayout({ open, children, onClose }: IModalLayout) {
  return (
    <div className={`modal-overlay z-50 bg-[rgba(94,94,94,0.5)] ${open ? "flex" : "hidden"} `}>
      <div className="modal-container">
        <div onClick={onClose} className="absolute flex justify-center items-center cursor-pointer top-10 right-10 w-9 aspect-square rounded-full bg-grey-400">
          <TimesIcon width={8.33} height={8.33} />
        </div>
        {children}
      </div>
    </div>
  )
}

// 