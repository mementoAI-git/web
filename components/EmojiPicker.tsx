import EmojiIcon from "@/public/icon/emoji.svg";
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import { useState } from "react";
import useClickAway from "@/hooks/use-clickaway";
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react';

interface IEmojiPicker {
  className?: string
  onSelect: (data) => void
}

export default function EmojiPicker({ onSelect, className = "" }: IEmojiPicker) {
  const [show, setShow] = useState(false)
  const ref = useClickAway(() => setShow(false))

  const { refs, floatingStyles } = useFloating({
    placement: 'top',
    middleware: [
      offset(10),
      flip(),
      shift({
        padding: 20,
        mainAxis: true,
        crossAxis: true,
      })
    ],
    whileElementsMounted: autoUpdate,
  });

  return (
    <div
      ref={(el) => {
        ref.current = el
        refs.setReference(el)
      }}
      onClick={() => setShow(p => !p)}
      className={`relative size-12 flex justify-center cursor-pointer items-center ${className}`}
    >
      <EmojiIcon width={20} height={20} />

      {show && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          onClick={(e) => e.stopPropagation()}
          className="z-50"
        >
          <Picker
            theme="light"
            data={data}
            onEmojiSelect={onSelect}
          />
        </div>
      )}
    </div>
  )
}