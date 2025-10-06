"use clients"

import { AudioRecorder, VideoRecorder } from "@/components/Recorder";
import { FooterBtnGroup } from "@/components/Memory/FooterBtnGroup";
import { TextArea } from "@/components/Memory/TextArea";
import { ModalWrapper } from "@/components/ModalLayout";
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

export function CreateMemory({ data, isMobile = false }) {
  const { payload, type: declaredType } = data
  const { close, push, open } = useModal()

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
      if (isEmpty(p.title)) {
        return toast.error("Title is required")
      }

      const attachments = localStorage.getItem(storageKeys.attachments)
      if (attachments) {
        p.attachments = JSON.parse(attachments).files.map(f => f.result._id)
      }
      const result = await trigger({ ...p, status: "draft" })
      // console.log("result here", result)
      if (result?.success) {
        console.log("[CreateMemory] opening set-tag-permission with:", result.data)
        open("set-tag-permission", { memory: result.data, isNew: true });
        setEditMode(false)
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
    const attachments = localStorage.getItem(storageKeys.attachments)
    if (attachments) {
      setAttachments(JSON.parse(attachments).files.map(f => f.result))
    }
  }, [])

  const header = (
    <h2 className="text-xl font-geist font-semibold text-secondary">Create Memory</h2>
  )

  const footer = (
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
  )

  return (
    <ModalWrapper
      isMobile={isMobile}
      header={header}
      footer={footer}
      onClose={handleClose}
    >
      <div className="space-y-4">
        <div className="py-2">
          <input
            placeholder="Enter title here"
            value={values.title}
            name="title"
            onChange={handleChange}
            className="font-inter resize-none text-3xl w-full h-9 min-h-9 first-letter:capitalize outline-0 font-semibold"
          />
        </div>

        <div className="flex gap-6 border-b border-gray-200">
          <button
            onClick={() => setType("text")}
            className={`pb-3 px-1 font-medium text-sm transition-colors relative ${
              type === "text"
                ? "text-[#52A1DD]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Use texts
            {type === "text" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#52A1DD]" />
            )}
          </button>
          <button
            onClick={() => setType("audio")}
            className={`pb-3 px-1 font-medium text-sm transition-colors relative ${
              type === "audio"
                ? "text-[#52A1DD]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Use audio
            {type === "audio" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#52A1DD]" />
            )}
          </button>
          <button
            onClick={() => setType("video")}
            className={`pb-3 px-1 font-medium text-sm transition-colors relative ${
              type === "video"
                ? "text-[#52A1DD]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Paste something
            {type === "video" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#52A1DD]" />
            )}
          </button>
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
    </ModalWrapper >
  )
}