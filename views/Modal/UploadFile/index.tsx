"use client";

import UploadInput from "./UploadInput"
import { useCallback, useEffect, useState } from "react"
import UploadItem from "./UploadItem"
import { IFile } from "@/utility/interface"
import useSWRMutation from "swr/mutation"
import endpoint from "@/api/endpoint"
import { fileUploadFetcher } from "@/api/fetcher"
import useFetcher from "@/hooks/use-fetcher"
import Spinner from "@/components/Spinner"
import { useModal } from "@/hooks/use-modal"
import { ModalCloseBtn } from "@/components/ModalLayout"
import { toast } from "sonner"
import { storageKeys } from "@/utility/constant";
import { isEmpty } from "@/utility";
import { mutate } from "swr";

export interface IFileState {
  file: File
  result?: IFile
  progress: number
  id: string
}

export default function UploadFiles({ data: id }) {
  const { close } = useModal()
  const [files, setFiles] = useState<IFileState[]>([])
  const { trigger: uploadFile } = useSWRMutation(endpoint.upload, fileUploadFetcher)
  const { trigger: deleteFile } = useFetcher(endpoint.files, "delete")
  const { trigger: addToPost, isMutating: adding } = useFetcher(id ? `${endpoint.memories}/${id}` : null, "put")

  const handleDeleteFile = async (file: IFileState) => {
    if (file?.result?.name) {
      await deleteFile(file.result.name)
    }

    setFiles(files => files.filter((f) => f.id !== file.id))
    if (isEmpty(id)) {
      localStorage.setItem(
        storageKeys.attachments,
        JSON.stringify({ files })
      )
    }
  }

  const handleAddToPost = async () => {
    if (adding) return
    const attachments = files.map(f => f.result._id)

    if (isEmpty(id)) {
      localStorage.setItem(
        storageKeys.attachments,
        JSON.stringify({ files })
      )
    } else {
      await addToPost({ attachments })
      mutate(endpoint.memories)
    }

    setFiles([])
    close("file-upload")
  }

  const handleOnUpload = useCallback(async (file: IFileState) => {
    setFiles(prev => [...prev, file])

    const result = await uploadFile({
      file: file.file,
      onProgress: (p: number) => {
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, progress: p } : f))
      }
    })
    if (!result.data[0]) {
      toast.error("Upload unsuccessful")
      // Remove the failed file from the files array
      setFiles(prev => prev.filter(f => f.id !== file.id))
    } else {
      toast.success(result?.message || "Success");
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, result: result.data[0] } : f))
    }
  }, [])

  useEffect(() => {
    const attachments = localStorage.getItem(storageKeys.attachments)
    if (attachments) {
      setFiles(JSON.parse(attachments).files)
    }
  }, [])

  return (
    <div className="modal-container">
      <ModalCloseBtn onClick={() => close("file-upload")} />
      <div className="space-y-4 sm:space-y-6">
        <h4 className="modal-title text-lg sm:text-xl lg:text-2xl">Upload your images or videos</h4>

        <div className="mt-4 sm:mt-6 flex flex-col">
          <div className="flex flex-col gap-4 sm:gap-6 min-h-[300px] sm:min-h-[425px] max-h-[500px] sm:max-h-[660px]">
            <UploadInput onUpload={handleOnUpload} />

            {files.length > 0 && (
              <div className="space-y-3 sm:space-y-4 flex-1 max-h-[200px] sm:max-h-[300px] overflow-y-auto">
                {files.map((f, i) => (
                  <UploadItem
                    onDelete={handleDeleteFile}
                    file={f}
                    key={i}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="flex mt-6 gap-3 justify-end">
            <button className="btn-outline">Discard</button>
            <button onClick={handleAddToPost} disabled={files.length === 0} className="btn">
              Add to post
              <Spinner loading={adding} className="!size-3 sm:!size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}