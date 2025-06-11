import AttachmentIcon from "@/public/icon/clip.svg"
import { IOnUploadPayload } from "@/utility/interface";
import { ChangeEvent, useCallback } from "react";
import { v4 as uuidv4 } from 'uuid';

interface IAttachFile {
  onUpload: (p: IOnUploadPayload) => void
}

export default function AttachFileBtn({ onUpload }: IAttachFile) {

  const handleUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files[0]
    onUpload({ id: uuidv4(), file, progress: 0 })
  }, [])

  return (
    <label className="text-secondary border cursor-pointer border-[#EAECF0] flex justify-center items-center size-10 rounded-full">
      <input
        accept="image/*"
        id="attachment"
        type="file"
        hidden
        onChange={handleUpload}
      />
      <AttachmentIcon width={16} />
    </label>
  )
}