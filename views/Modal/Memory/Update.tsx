import endpoint from "@/api/endpoint";
import AddFileButton from "@/components/AddFileButton";
import ImageThumbnail from "@/components/ImageThumbnail";
import { TextArea } from "@/components/Memory/TextArea";
import { ModalCloseBtn, ModalWrapper } from "@/components/ModalLayout";
import Spinner from "@/components/Spinner";
import useFetcher from "@/hooks/use-fetcher";
import { useModal } from "@/hooks/use-modal";
import { isEmpty } from "@/utility";
import { IMemory } from "@/utility/interface";
import { useState } from "react";
import { mutate } from "swr";

export function UpdateMemory({ data: memory, isMobile = false }) {
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

  const footer = (
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
  )

  return (
    <ModalWrapper
      isMobile={isMobile}
      header={<h4 className="modal-title">{memory?.title}</h4>}
      footer={footer}
      onClose={() => close("edit-memory")}
    >
      <div className="space-y-6">
        <h4 className="modal-title hidden sm:block">{memory?.title}</h4>
        <TextArea
          value={text}
          name="body"
          attachments={memory?.attachments}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
    </ModalWrapper >
  )
}