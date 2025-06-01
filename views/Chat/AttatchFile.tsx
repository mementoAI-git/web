import PlusIcon from "@/public/icon/plus.svg";
import { toBase64 } from "@/utility";
import { IFile } from "@/utility/interface";
import { ChangeEvent, useCallback } from "react";
import { v4 as uuidv4 } from 'uuid';

export interface IOnUploadPayload {
  base64: string
  file: File
  id: string
  progress: number
  uploadedFile?: IFile | null
}

interface IAttachFile {
  onUpload: (p: IOnUploadPayload) => void
}

export default function AttatchFile({ onUpload }: IAttachFile) {

  const handleUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files[0]
    const base64 = await toBase64(file)
    onUpload({ id: uuidv4(), file, progress: 0, base64 })
  }, [])
  return (
    <label
      htmlFor="attachment"
      className="flex size-12 cursor-pointer items-center justify-center rounded-full border border-[#EAECF0]"
    >
      <input
        accept="image/*"
        id="attachment"
        type="file"
        hidden
        onChange={handleUpload}
      />
      <PlusIcon width={20} height={20} />
    </label>
  )
}