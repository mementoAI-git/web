"use client"

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
import { Sheet } from "react-modal-sheet";

const initial = {
  title: "",
  body: "",
  file: null,
  attachments: []
}

const INPUT_TYPES = [
  { value: "text", label: "Use texts" },
  { value: "audio", label: "Use audio" }
] as const

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(" ")

const header = (
  <h2 className="text-xl font-geist font-semibold text-secondary">Create Memory</h2>
)

function Content({ data }) {
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

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="py-2">
          <input
            placeholder="Enter title here"
            value={values.title}
            name="title"
            onChange={handleChange}
            className="font-canela placeholder:text-gray-300 resize-none text-3xl w-full h-9 min-h-9 first-letter:capitalize outline-0"
          />
        </div>

        <div className="flex gap-6 border-b border-gray-200">
          {INPUT_TYPES.map(({ value, label }) => {
            const isActive = type === value
            return (
              <button
                key={value}
                onClick={() => setType(value)}
                className={cn(
                  "pb-3 px-1 font-medium text-sm transition-colors relative",
                  isActive
                    ? "text-[#52A1DD]"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#52A1DD]" />
                )}
              </button>
            )
          })}
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

export function CreateMemory({ data }) {
  const { close } = useModal()

  return (
    <div >
      <div className="hidden !min-w-[618px] sm:block modal-container">
        <ModalCloseBtn onClick={() => close("set-tag-permission")} />
        <Content data={data} />
      </div>
      <Sheet
        detent="content"
        className="block md:hidden"
        isOpen
        onClose={() => close("set-tag-permission")}
        snapPoints={[0.5, 0.75, 1]}
        initialSnap={1}
      >
        <Sheet.Container className="bg-sand-1" >
          <Sheet.Header className="bg-sand-1 rounded-3xl" />
          <Sheet.Content className="bg-sand-1 px-4 pb-6">
            <ModalCloseBtn className="!relative ml-auto !right-0 !top-0 mb-2" onClick={() => close("set-tag-permission")} />
            <Content {...{ data }} />
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
    </div >
  )
}