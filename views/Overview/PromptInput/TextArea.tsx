import { usePrompt } from "@/hooks/use-prompt";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

export default function TextArea() {
  const { set } = usePrompt()
  const [text, setText] = useState("")
  const [debouncedText] = useDebounce(text, 300)

  useEffect(() => {
    set("edit_mode", debouncedText.length > 0)
  }, [debouncedText])
  return (
    <textarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      className="placeholder:text-[#C7C9C8] resize-none w-full outline-0 p-3 rounded-2xl bg-grey-700 text-xs font-inter min-h-[425px]"
      placeholder="Tap to start typing..."
    ></textarea>
  )
}