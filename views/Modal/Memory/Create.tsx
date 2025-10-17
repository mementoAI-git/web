"use client"

import { AudioRecorder, VideoRecorder } from "@/components/Recorder";
import { FooterBtnGroup } from "@/components/Memory/FooterBtnGroup";
import { TextArea } from "@/components/Memory/TextArea";
import { ModalCloseBtn } from "@/components/ModalLayout";
import useForm from "@/hooks/use-form";
import { useModal } from "@/hooks/use-modal";
import { useRef, useState, useEffect, forwardRef, useImperativeHandle, useCallback } from "react";
import endpoint from "@/api/endpoint";
import useSWRMutation from "swr/mutation";
import { fileUploadFetcher } from "@/api/fetcher";
import { cn, isEmpty } from "@/utility";
import { toast } from "sonner";
import { Sheet } from "react-modal-sheet";
import useFileUpload from "@/hooks/use-file-upload";
import { v4 as uuidv4 } from "uuid";
import { CloseWithFilesConfirmation } from "./CloseWithFilesConfirmation";
import { createPortal } from "react-dom";

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

interface IContentProps {
  data: any
}

const Content = forwardRef(({ data }: IContentProps, ref) => {
  const { payload, type: declaredType } = data
  const { open } = useModal()

  const audioRef = useRef(null)
  const videoRef = useRef(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editMode, setEditMode] = useState(false)
  const [recording, setRecording] = useState(false)
  const [type, setType] = useState(declaredType || "text")

  const { trigger, isMutating } = useSWRMutation(endpoint.memories, fileUploadFetcher)
  const { files, handleUpload, handleDeleteFile, setFiles } = useFileUpload()

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

      // Add attachment IDs from the uploaded files
      const uploadedFiles = files.filter(f => f.uploadedFile).map(f => f.uploadedFile._id)
      if (uploadedFiles.length > 0) {
        p.attachments = uploadedFiles
      }

      const result = await trigger({ ...p, status: "draft" })
      if (result?.success) {
        open("set-tag-permission", { memory: result.data, isNew: true });
        setEditMode(false)
        setFiles([])
      }
    },
  })

  // Create delete all files function and assign to ref
  const handleDeleteAllFiles = useCallback(async () => {
    if (files.length === 0) return;
    console.log("files to be deleted", files)
    const deletePromises = files.map(async (file) => {
      if (file.uploadedFile) {
        await handleDeleteFile(file)
      }
    })
    await Promise.all(deletePromises)

    setFiles([])
    handleValue("file", null)
    setRecording(false)

    if (videoRef.current) {
      videoRef.current.resetStream();
      videoRef.current.reset();
    }
    if (audioRef.current) audioRef.current.reset();
  }, [handleDeleteFile, handleValue, setFiles])

  useImperativeHandle(ref, () => ({
    handleDeleteAllFiles,
    hasFiles: files.length > 0
  }), [handleDeleteAllFiles, files.length])

  const handleOnFinishRecording = (f) => {
    handleValue("file", f)
    setRecording(false)
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

  const handleAddFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleDiscard = () => {
    setEditMode(false)
    setValues(initial)
    setRecording(false)
    setFiles([])

    if (videoRef.current) {
      videoRef.current.resetStream();
      videoRef.current.reset();
    }
    if (audioRef.current) audioRef.current.reset();
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/heic,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

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
                files={files}
                onChange={handleChange}
              />
        }
      </div>
      <FooterBtnGroup
        onAddFileBtnClick={handleAddFileClick}
        onDiscard={handleDiscard}
        onSave={handleSubmit}
        disabled={(["audio", "video"].includes(type) && recording) || files.some(f => !f.uploadedFile)}
        saving={isMutating}
        editMode={editMode || !isEmpty(values.body)}
      />
    </div>
  )
})

export function CreateMemory({ data }) {
  const { close } = useModal()
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)
  const contentRef = useRef(null)

  const handleCloseWithConfirmation = () => {
    if (contentRef.current?.hasFiles) {
      setShowCloseConfirmation(true)
    } else {
      close("create-memory")
    }
  }

  const handleConfirmClose = async () => {
    setShowCloseConfirmation(false)

    if (contentRef.current) {
      await contentRef.current?.handleDeleteAllFiles()
    }
    close("create-memory")
  }

  return (
    <div >
      <div className="hidden !min-w-[618px] sm:block modal-container">
        <ModalCloseBtn onClick={handleCloseWithConfirmation} />
        <Content
          data={data}
          ref={contentRef}
        />
      </div>
      <Sheet
        detent="content"
        className="block sm:hidden"
        isOpen
        onClose={handleCloseWithConfirmation}
        snapPoints={[0.5, 0.75, 1]}
        initialSnap={1}
      >
        <Sheet.Container className="bg-sand-1" >
          <Sheet.Header className="bg-sand-1 rounded-3xl" />
          <Sheet.Content className="bg-sand-1 px-4 pb-6">
            <ModalCloseBtn
              className="!relative ml-auto !right-0 !top-0 mb-2"
              onClick={handleCloseWithConfirmation}
            />
            <Content data={data} ref={contentRef} />
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>

      {/* Confirmation Dialog */}
      {showCloseConfirmation && createPortal(
        <CloseWithFilesConfirmation
          open={showCloseConfirmation}
          close={() => setShowCloseConfirmation(false)}
          onConfirm={handleConfirmClose}
        />,
        document.body
      )}
    </div >
  )
}