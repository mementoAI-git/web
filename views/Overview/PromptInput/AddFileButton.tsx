import PlusIcon from "@/public/icon/plus.svg"
import CameraIcon from "@/public/icon/camera.svg"
import MicIcon from "@/public/icon/mic.svg"
import ImageIcon from "@/public/icon/image.svg"
import ClipIcon from "@/public/icon/clip.svg"
import PlanepaperIcon from "@/public/icon/plane-paper.svg"
import { useState } from "react"
import useClickAway from "@/hooks/use-clickaway"
import { usePrompt } from "@/hooks/use-prompt"

export default function AddFileButton() {
  const { push } = usePrompt()
  const [show, setShow] = useState(false)
  const ref = useClickAway(() => setShow(false))
  return (
    <div ref={ref} className="relative">
      {
        show &&
        <div className="bg-white text-[#344054] -top-15 absolute rounded-xl shadow-btn flex gap-1 p-2">
          {
            [
              <CameraIcon width={16} height={16} />,
              <ImageIcon width={16} height={16} />,
              <MicIcon width={16} height={16} />,
              <ClipIcon width={16} height={16} />,
              <PlanepaperIcon width={16} height={16} />
            ].map((f, i) => (
              <div key={i} onClick={() => push("file-upload")} className="size-8 p-2 cursor-pointer flex items-center justify-center">
                {f}
              </div>
            ))
          }
        </div>
      }
      <div onClick={() => setShow(p => !p)} className=" w-10 cursor-pointer aspect-square rounded-full border border-[#EAECF0] flex items-center justify-center">
        <PlusIcon width={12} height={12} />
      </div>
    </div>
  )
}