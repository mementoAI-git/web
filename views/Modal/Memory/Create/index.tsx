import { AudioRecorder, VideoRecorder } from "@/components/Recorder";
import { FooterBtnGroup } from "@/components/Memory/FooterBtnGroup";
import { TextArea } from "@/components/Memory/TextArea";
import { ModalCloseBtn } from "@/components/ModalLayout";
import useForm from "@/hooks/use-form";
import { useModal } from "@/hooks/use-modal";
import { useState } from "react";
import endpoint from "@/api/endpoint";
import useSWRMutation from "swr/mutation";
import { fileUploadFetcher } from "@/api/fetcher";
import { isEmpty } from "@/utility";
import { toast } from "sonner";

const initial = {
  title: "",
  body: "",
  file: null
}

export function CreateMemory() {
  const { close, open } = useModal()
  const [editMode, setEditMode] = useState(false)
  const [recording, setRecording] = useState(false)
  const [type, setType] = useState("text")
  const { trigger, isMutating } = useSWRMutation(endpoint.memories, fileUploadFetcher)

  const handleOnFinishRecording = (f) => {
    handleValue("file", f)
    setRecording(false)
  }

  const handleOnStartRecording = () => {
    setEditMode(true)
    setRecording(true)
  }

  const { values, handleChange, setValues, handleSubmit, handleValue } = useForm({
    initial,
    async onSubmit(p) {
      if (isEmpty(p.title)) {
        return toast.error("Title is required")
      }
      const result = await trigger(p)
      if (result?.success) {
        open("set-tag-permission", result.data);
        setEditMode(false)
      }
    },
  })

  const handleDiscard = () => {
    setEditMode(false)
    setValues(initial)
    setRecording(false)
  }

  return (
    <div className="modal-container">
      <ModalCloseBtn onClick={() => close("create-memory")} />
      <div className="space-y-3">
        <div className="border-t border-[#0011661A] py-2 pr-10">
          <input
            placeholder="Enter title here"
            value={values.title}
            name="title"
            onChange={handleChange}
            className="font-inter resize-none text-2xl w-full h-9 min-h-9 first-letter:capitalize outline-0 font-semibold"
          />
        </div>
        {
          type === "audio" ?
            <AudioRecorder
              onFinish={handleOnFinishRecording}
              onStart={handleOnStartRecording}
            /> :
            type === "video" ?
              <VideoRecorder
                onFinish={handleOnFinishRecording}
                onStart={handleOnStartRecording}
              /> :
              <TextArea
                value={values.body}
                name="body"
                onChange={handleChange}
              />
        }
      </div>
      <FooterBtnGroup
        onAddFileBtnClick={console.log}
        onDiscard={handleDiscard}
        onSave={handleSubmit}
        onTypeChange={setType}
        disabled={["audio", "video"].includes(type) && recording}
        saving={isMutating}
        type={type}
        editMode={editMode || !isEmpty(values.body)}
      />
    </div>
  )
}