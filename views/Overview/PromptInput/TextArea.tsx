import { useEffect, useState } from "react";
import PromptInputLayout from "./Layout";
import { usePrompt } from "@/hooks/use-prompt";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { isEmpty } from "@/utility";
import ImageThumbnail from "@/components/ImageThumbnail";

export default function TextArea() {
  const { data, set, push } = usePrompt()
  const [text, setText] = useState(data?.body)
  const { isMutating, trigger } = useFetcher(endpoint.replyPrompt)

  const handeleSave = async () => {
    if (text === data?.body) return;
    await trigger(
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
    push("tag-permission")
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
      <div className="flex flex-col gap-6 p-3 rounded-2xl bg-grey-700 text-xs font-inter min-h-[425px]">
        {
          !isEmpty(data?.attachments) &&
          <div className="relative size-fit">
            <ImageThumbnail
              boxClassName="!rounded-[12px] !border-2"
              images={data?.attachments}
              size={69}
            />
            {
              data?.attachments.length > 3 &&
              <div className="absolute z-40 top-0 -right-10 bg-secondary border border-white text-[#C1FDC5] font-light text-xs font-inter rounded-full px-1.5 py-0.5">
                +{data?.attachments.length} files
              </div>
            }
          </div>
        }

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="placeholder:text-[#C7C9C8] resize-none size-full outline-0 flex-1"
          placeholder="Tap to start typing..."
        ></textarea>
      </div>
    </PromptInputLayout>
  )
}