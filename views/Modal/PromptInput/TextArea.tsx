import { useEffect, useState } from "react";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { isEmpty } from "@/utility";
import ImageThumbnail from "@/components/ImageThumbnail";
import { useModal } from "@/hooks/use-modal";
import useSWR from "swr";
import PromptLayout from "./Layout";

export default function TextArea({ data }) {
  const { open, push, close } = useModal()
  const [text, setText] = useState(data?.body);
  const { data: result } = useSWR(`${endpoint.replyPrompt}/${data?.prompt}`)
  const { trigger, isMutating: saving } = useFetcher(endpoint.replyPrompt)

  const memory = result?.data || data

  const handleSave = async () => {
    if (text === data?.body) return;
    await trigger(
      { text, prompt_id: data?.prompt },
      {
        revalidate: false,
        populateCache(result, currentData) {
          if (result?.data) {
            return { ...currentData, data: result.data };
          }
          return currentData;
        },
      },
    );
    push("set-tag-permission", memory);
  };

  const handleDiscard = () => {
    setText(data?.body);
  };

  useEffect(() => {
    if (memory?.body) {
      setText(memory?.body);
    }
  }, [memory?.body]);
  return (
    <PromptLayout
      editMode={text !== memory?.body}
      onDiscard={handleDiscard}
      onSave={handleSave}
      saving={saving}
      type="text"
      memory={memory ? { ...data, ...memory } : data}
    >
      <div className="flex min-h-[425px] flex-col gap-6 rounded-2xl bg-grey-700 p-3 font-inter text-xs">
        {!isEmpty(memory?.attachments) && (
          <div onClick={() => open("file-preview", memory?.attachments)} className="relative size-fit">
            <ImageThumbnail
              boxClassName="!rounded-[12px] !border-2"
              images={memory?.attachments}
              size={69}
            />
            {memory?.attachments.length > 3 && (
              <div className="absolute top-0 -right-10 z-40 rounded-full border border-white bg-secondary px-1.5 py-0.5 font-inter text-xs font-light text-[#C1FDC5]">
                +{memory?.attachments.length - 3} files
              </div>
            )}
          </div>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="size-full flex-1 resize-none outline-0 placeholder:text-[#C7C9C8]"
          placeholder="Tap to start typing..."
        ></textarea>
      </div>
    </PromptLayout>
  );
}
