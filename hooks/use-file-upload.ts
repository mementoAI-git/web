import endpoint from "@/api/endpoint";
import { fileUploadFetcher } from "@/api/fetcher";
import { IOnUploadPayload } from "@/utility/interface";
import { useState } from "react";
import { toast } from "sonner";
import useSWRMutation from "swr/mutation";
import useFetcher from "./use-fetcher";

export default function useFileUpload() {
  const [files, setFiles] = useState<IOnUploadPayload[]>([])
  const { trigger: uploadFile } = useSWRMutation(endpoint.upload, fileUploadFetcher)
  const { trigger: deleteFile } = useFetcher(endpoint.files, "delete")

  const handleUpload = async (file: IOnUploadPayload) => {
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
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, uploadedFile: result.data[0] } : f))
    }
  }

  const handleDeleteFile = async ({ id, uploadedFile }: IOnUploadPayload) => {
    if (!uploadedFile?.name) return
    await deleteFile(uploadedFile.name);

    setFiles(files => files.filter((f) => f.id !== id))
  }

  return { files, handleUpload, handleDeleteFile, setFiles }
}