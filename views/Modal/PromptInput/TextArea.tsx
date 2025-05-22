import { useEffect, useState } from "react";
import useFetcher from "@/hooks/use-fetcher";
import endpoint from "@/api/endpoint";
import { isEmpty } from "@/utility";
import ImageThumbnail from "@/components/ImageThumbnail";
import { useModal } from "@/hooks/use-modal";
import useSWR from "swr";
import PromptLayout from "./Layout";

export default function TextArea({ data }) {
  const { open, push } = useModal()
  const [text, setText] = useState(data?.body);
  const [title, setTitle] = useState("");
  const { data: result, isLoading } = useSWR(data?.prompt ? `${endpoint.replyPrompt}/${data?.prompt}` : null)
  const { trigger, isMutating: saving } = useFetcher(data?.prompt ? endpoint.replyPrompt : endpoint.memories)

  const memory = result?.data || data

  const handleSave = async () => {
    if (text === data?.body) return;
    const payload: any = { body: text }
    if (isEmpty(data?.prompt)) {
      payload.title = title
    } else {
      payload.prompt_id = data?.prompt_id
    }
    await trigger(payload);
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
      loading={isLoading}
      type="text"
      memory={memory ? { ...data, ...memory } : data}
    >
      {
        isEmpty(data?.title) &&
        <div className="border-t border-[#0011661A] py-2 pr-10">
          <input
            placeholder="Enter title here"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-inter resize-none text-2xl w-full h-9 min-h-9 first-letter:capitalize outline-0 font-semibold"
          />
        </div>
      }
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
          disabled={isLoading}
          onChange={(e) => setText(e.target.value)}
          className="size-full flex-1 resize-none outline-0 placeholder:text-[#C7C9C8]"
          placeholder="Tap to start typing..."
        ></textarea>
      </div>
    </PromptLayout>
  );
}
