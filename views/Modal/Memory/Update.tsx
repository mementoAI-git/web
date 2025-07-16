import endpoint from "@/api/endpoint";
import AddFileButton from "@/components/AddFileButton";
import ImageThumbnail from "@/components/ImageThumbnail";
import { ModalCloseBtn } from "@/components/ModalLayout";
import Spinner from "@/components/Spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useModal } from "@/hooks/use-modal";
import { isEmpty } from "@/utility";
import { IMemory } from "@/utility/interface";
import { useState } from "react";
import { mutate } from "swr";

export function UpdateMemory({ data: memory }: { data: IMemory }) {
  const { push, close } = useModal()
  const [text, setText] = useState(memory.body);
  const { trigger, isMutating } = useFetcher(`${endpoint.memories}/${memory._id}`, "put")

  const handleContinueBtn = async () => {
    if (isMutating) return;
    if (text !== memory.body) {
      await trigger({ body: text })
      mutate(endpoint.memories)
    }
    push("set-tag-permission", { memory, isNew: false })
  }
  return (
    <div className="modal-container">
      <ModalCloseBtn onClick={() => close("edit-memory")} />
      <div className="space-y-6">
        <h4 className="modal-title">{memory?.title}</h4>
        <div className="mt-5">
          <div className="w-full">
            <div className="flex min-h-[425px] flex-col gap-6 rounded-2xl bg-grey-700 p-3 font-inter text-xs">
              {
                !isEmpty(memory?.attachments) && (
                  <div onClick={() => push("file-preview", memory?.attachments)} className="relative size-fit">
                    <ImageThumbnail
                      boxClassName="!rounded-[12px] !border-2"
                      images={memory?.attachments}
                      size={69}
                    />
                    {memory?.attachments.length > 3 && (
                      <div className="absolute top-0 -right-10 z-40 rounded-full border border-white bg-secondary px-1.5 py-0.5 font-inter text-xs font-light text-[#C1FDC5]">
                        +{memory?.attachments.length} files
                      </div>
                    )}
                  </div>
                )
              }

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="size-full flex-1 resize-none outline-0 placeholder:text-[#C7C9C8]"
                placeholder="Tap to start typing..."
              ></textarea>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <AddFileButton onClick={() => push("file-upload", memory._id)} />
            <div className="flex items-center gap-2">
              <button className="btn-outline !border-[#C7C9C8]">
                Cancel
              </button>
              <button onClick={handleContinueBtn} className="btn flex items-center gap-2">
                Continue
                <Spinner loading={isMutating} className="!size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}