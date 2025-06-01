import EmojiIcon from "@/public/icon/emoji.svg";
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import { useState } from "react";
import useClickAway from "@/hooks/use-clickaway";

interface IEmojiPicker {
  className?: string
  onSelect: (data) => void
}

export default function EmojiPicker({ onSelect, className = "" }: IEmojiPicker) {
  const [show, setShow] = useState(false)
  const ref = useClickAway(() => setShow(false))
  return (
    <div ref={ref} onClick={() => setShow(p => !p)} className={`relative size-12 flex justify-center cursor-pointer  items-center ${className}`}>
      <EmojiIcon width={20} height={20} />
      {
        show &&
        <div onClick={(e) => e.stopPropagation()} className="absolute bottom-full right-0">
          <Picker
            theme="light"
            data={data}
            onEmojiSelect={onSelect}
          />
        </div>
      }
    </div>
  )
}