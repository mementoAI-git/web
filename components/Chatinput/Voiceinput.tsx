import TImesMarkIcon from "@/public/icon/times.svg"
import MicIcon from "@/public/icon/mic.svg"
import { createPortal } from "react-dom"
import { cn } from "@/utility"

export default function Voiceinput({ onCancel }) {
  return createPortal(
    <div className="fixed border bg-background h-screen w-screen top-0 bottom-0 right-0 left-0 flex justify-center items-center">
      <div className="space-y-10">
        <div className="space-y-6">
          <div className="size-30 rounded-full border" />
          <span className="font-georgia text-2xl text-center text-sand-12">00:13:00</span>
        </div>
        <div className="flex gap-6 items-center">
          <div className={cn("icon-container !bg-blue-2", "!rounded-xl")}>
            <MicIcon className="size-5 text-blue-6" />
          </div>

          <div onClick={onCancel} className={cn("icon-container !bg-blue-2", "!rounded-xl")}>
            <TImesMarkIcon className="size-4 text-blue-6" />
          </div>
        </div>
      </div>
    </div >,
    document.body
  )
}