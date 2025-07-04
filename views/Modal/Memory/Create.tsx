"use clients"

import { AudioRecorder, VideoRecorder } from "@/components/Recorder";
import { FooterBtnGroup } from "@/components/Memory/FooterBtnGroup";
import { TextArea } from "@/components/Memory/TextArea";
import { ModalCloseBtn } from "@/components/ModalLayout";
import useForm from "@/hooks/use-form";
import { useModal } from "@/hooks/use-modal";
import { useEffect, useRef, useState } from "react";
import endpoint from "@/api/endpoint";
import useSWRMutation from "swr/mutation";
import { fileUploadFetcher } from "@/api/fetcher";
import { isEmpty } from "@/utility";
import { toast } from "sonner";
import { storageKeys } from "@/utility/constant";

const initial = {
  title: "",
  body: "",
  file: null,
  attachments: []
}

export function CreateMemory({ data }) {
  const { payload, type: declaredType } = data
  const { close, open, push } = useModal()

  const audioRef = useRef(null)
  const videoRef = useRef(null)

  const [editMode, setEditMode] = useState(false)
  const [recording, setRecording] = useState(false)
  const [type, setType] = useState(declaredType || "text")
  const [attachments, setAttachments] = useState([])

  const { trigger, isMutating } = useSWRMutation(endpoint.memories, fileUploadFetcher)

  const handleOnStartRecording = () => {
    setEditMode(true)
    setRecording(true)
  }

  const { values, handleChange, setValues, handleSubmit, handleValue } = useForm({
    initial: { ...initial, ...payload },
    async onSubmit(p) {
      console.log(p)
      if (isEmpty(p.title)) {
        return toast.error("Title is required")
      }

      const attachments = localStorage.getItem(storageKeys.attachments)
      if (attachments) {
        p.attachments = JSON.parse(attachments).files.map(f => f.result._id)
      }
      const result = await trigger(p)
      if (result?.success) {
        open("set-tag-permission", result.data);
        setEditMode(false)
      }

      if (attachments) {
        localStorage.removeItem(storageKeys.attachments)
      }
    },
  })

  const handleOnFinishRecording = (f) => {
    handleValue("file", f)
    setRecording(false)
  }

  const handleDiscard = () => {
    setEditMode(false)
    setValues(initial)
    setRecording(false)

    if (videoRef.current) {
      videoRef.current.resetStream();
      videoRef.current.reset();
    }
    if (audioRef.current) audioRef.current.reset();
  }

  const handleClose = () => {
    handleDiscard()
    close("create-memory")
  }

  useEffect(() => {
    console.log("Mounted!!")
    const attachments = localStorage.getItem(storageKeys.attachments)
    if (attachments) {
      console.log(JSON.parse(attachments).files.map(f => f.result))
      setAttachments(JSON.parse(attachments).files.map(f => f.result))
    }
  }, [])

  return (
    <div className="modal-container">
      <ModalCloseBtn onClick={handleClose} />
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
              ref={audioRef}
              onFinish={handleOnFinishRecording}
              onStart={handleOnStartRecording}
            /> :
            type === "video" ?
              <VideoRecorder
                ref={videoRef}
                onFinish={handleOnFinishRecording}
                onStart={handleOnStartRecording}
              /> :
              <TextArea
                value={values.body}
                name="body"
                attachments={attachments}
                onChange={handleChange}
              />
        }
      </div>
      <FooterBtnGroup
        onAddFileBtnClick={() => push("file-upload", null)}
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