import { useEffect, useState } from "react";
import PromptInputLayout from "./Layout";
import { usePrompt } from "@/hooks/use-prompt";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { isEmpty } from "@/utility";

export default function TextArea() {
  const { data, set } = usePrompt()
  const [text, setText] = useState(data?.body)
  const { isMutating, trigger } = useFetcher(endpoint.replyPrompt)

  const handeleSave = () => {
    if (text === data?.body) return;
    trigger(
      { text, prompt_id: data?.prompt },
      {
        revalidate: false,
        populateCache(result, currentData) {
          if (result?.data) {
            set("data", result?.data)
            return { ...currentData, data: result.data }
          }
          return currentData
        },
      }
    )
  }

  const handeleDiscard = () => {
    setText(data?.body)
  }

  useEffect(() => {
    if (data?.body) {
      setText(data?.body)
    }
  }, [data?.body])
  return (
    <PromptInputLayout
      editMode={text !== data?.body}
      onDiscard={handeleDiscard}
      onSave={handeleSave}
      saving={isMutating}
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="placeholder:text-[#C7C9C8] resize-none w-full outline-0 p-3 rounded-2xl bg-grey-700 text-xs font-inter min-h-[425px]"
        placeholder="Tap to start typing..."
      ></textarea>
    </PromptInputLayout>
  )
}