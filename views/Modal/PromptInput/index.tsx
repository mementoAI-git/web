"use client";

import { ModalCloseBtn } from "@/components/ModalLayout";
import { useModal } from "@/hooks/use-modal";
import { FooterBtnGroup } from "@/components/Memory/FooterBtnGroup";
import useForm from "@/hooks/use-form";
import { useEffect, useRef, useState } from "react";
import endpoint from "@/api/endpoint";
import { fileUploadFetcher } from "@/api/fetcher";
import useSWRMutation from "swr/mutation";
import { AudioRecorder, VideoRecorder } from "@/components/Recorder";
import { TextArea } from "@/components/Memory/TextArea";
import useFetcher from "@/hooks/use-fetcher";
import { isEmpty } from "@/utility";

const initial = {
  body: "",
  file: null,
  prompt_id: ""
}

export default function PromptInput({ data }) {
  const { close, open, push } = useModal()

  const audioRef = useRef(null)
  const videoRef = useRef(null)

  const [memory, setMemory] = useState(data)
  const [editMode, setEditMode] = useState(false)
  const [recording, setRecording] = useState(false)
  const [type, setType] = useState("text")

  const { trigger: getPromptResponse, isMutating: isLoading } = useFetcher(`${endpoint.replyPrompt}/${data?.prompt}`, "get")
  const { trigger, isMutating } = useSWRMutation(endpoint.replyPrompt, fileUploadFetcher)

  const { values, handleChange, setValues, handleSubmit, handleValue } = useForm({
    initial,
    async onSubmit(p) {
      p.prompt_id = memory?.prompt;
      const result = await trigger(p)
      if (result?.success) {
        open("set-tag-permission", result.data);
        setEditMode(false)
      }
    },
  })

  const onFinish = (f: File) => {
    handleValue("file", f)
    setRecording(false)
  }

  const onStart = () => {
    setEditMode(true)
    setRecording(true)
  }

  const handleDiscard = () => {
    setEditMode(false)
    setRecording(false)
    if (type === "text") {
      setValues(p => ({ ...p, body: memory?.body || "" }))
    } else {
      setValues(p => ({ ...p, file: null }))
      if (videoRef.current) videoRef.current.reset();
      if (audioRef.current) audioRef.current.reset();
    }
  }

  const handleClose = () => {
    handleDiscard()
    close("prompt")
  }

  useEffect(() => {
    if (!data?.prompt) return;
    getPromptResponse()
      .then(({ data: result }) => {
        if (result) {
          setMemory(result);
          if (result?.body) {
            handleValue("body", result?.body)
          }
        }
      })
      .catch(console.log)

  }, [data?.prompt]);

  console.log(memory?.body, values.body)
  console.log("edit mode:", (memory?.body ? values.body !== memory?.body : !isEmpty(values.body)))
  return (
    <div className="modal-container">
      <ModalCloseBtn onClick={handleClose} />
      <div className="space-y-3">
        <h4 className="modal-title">{memory?.title}</h4>
        {
          type === "audio" ?
            <AudioRecorder ref={audioRef} {...{ onFinish, onStart }} /> :
            type === "video" ?
              <VideoRecorder ref={videoRef} {...{ onFinish, onStart }} /> :
              <TextArea
                value={values.body}
                name="body"
                attachments={memory?.attachments}
                onChange={handleChange}
              />
        }
      </div>
      <FooterBtnGroup
        onAddFileBtnClick={() => push("file-upload", memory?._id || null)}
        onDiscard={handleDiscard}
        onSave={handleSubmit}
        onTypeChange={setType}
        disabled={(["audio", "video"].includes(type) && recording) || isLoading}
        saving={isMutating}
        type={type}
        editMode={editMode || (memory?.body ? values.body !== memory?.body : !isEmpty(values.body))}
      />
    </div>
  )

}
