import endpoint from "@/api/endpoint";
import AddFileButton from "@/components/AddFileButton";
import { FooterBtnGroup } from "@/components/Memory/FooterBtnGroup";
import { TextArea } from "@/components/Memory/TextArea";
import { ModalCloseBtn, ModalWrapper } from "@/components/ModalLayout";
import useFetcher from "@/hooks/use-fetcher";
import useFileUpload from "@/hooks/use-file-upload";
import { useModal } from "@/hooks/use-modal";
import { useRef, useState } from "react";
import { Sheet } from "react-modal-sheet";
import { mutate } from "swr";
import { v4 as uuidv4 } from "uuid";

export function Content({ data: memory }) {
  const { push, close } = useModal()
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  const { files, handleUpload, setFiles } = useFileUpload()

  const handleAddFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleDiscard = () => {
    setFiles([])
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    for (const file of selectedFiles) {
      // Convert to base64 for preview
      const reader = new FileReader()
      reader.onloadend = () => {
        const payload = {
          id: uuidv4(),
          file,
          base64: reader.result as string,
          progress: 0
        }
        handleUpload(payload)
      }
      reader.readAsDataURL(file)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }


  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/heic,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
      <div className="space-y-6">
        <h4 className="modal-title">{memory?.title}</h4>
        <TextArea
          value={text}
          name="body"
          files={files}
          attachments={memory?.attachments}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <FooterBtnGroup
        onAddFileBtnClick={handleAddFileClick}
        onDiscard={handleDiscard}
        onSave={handleContinueBtn}
        disabled={files.some(f => !f.uploadedFile)}
        saving={isMutating}
      />
    </div>
  )
}

export function UpdateMemory({ data }) {
  const { close } = useModal()

  return (
    <div >
      <div className="hidden !min-w-[618px] sm:block modal-container">
        <ModalCloseBtn onClick={() => close("create-memory")} />
        <Content data={data} />
      </div>
      <Sheet
        detent="content"
        className="block sm:hidden"
        isOpen
        onClose={() => close("create-memory")}
        snapPoints={[0.5, 0.75, 1]}
        initialSnap={1}
      >
        <Sheet.Container className="bg-sand-1" >
          <Sheet.Header className="bg-sand-1 rounded-3xl" />
          <Sheet.Content className="bg-sand-1 px-4 pb-6">
            <ModalCloseBtn className="!relative ml-auto !right-0 !top-0 mb-2" onClick={() => close("create-memory")} />
            <Content {...{ data }} />
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
    </div >
  )
}