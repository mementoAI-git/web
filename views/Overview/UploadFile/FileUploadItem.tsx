import FileIcon from "@/public/icon/file.svg"
import BinIcon from "@/public/icon/bin.svg"
import { formatFileSize, truncateFileName } from "@/utility"
import useSWRMutation from "swr/mutation"
import endpoint from "@/api/endpoint"
import { fileUploadFetcher } from "@/api/fetcher"
import { useEffect, useState } from "react"

interface IFileUploadItem {
  file: File
  onDelete: () => void
}

const fileColors: Record<string, string> = {
  pdf: "bg-red-800",
  png: "bg-primary",
  mp4: "bg-[#314FDF]"
}

export default function FileUploadItem({ file, onDelete }: IFileUploadItem) {
  const [progress, setProgress] = useState(0);
  const { trigger } = useSWRMutation(endpoint.upload, fileUploadFetcher)

  const ext = file.name.slice(file.name.lastIndexOf('.') + 1)

  useEffect(() => {
    if (file) {
      trigger({ file, onProgress: setProgress })
    }
  }, [file])
  return (
    <div className="flex items-start rounded-lg gap-3 py-3 px-4 border border-grey-500">
      <div className="w-8 h-10 relative text-[#D5D7DA]">
        <FileIcon />
        <span className={`absolute uppercase bottom-1 -left-2 p-[3px] ${fileColors[ext.toLowerCase()] || "bg-primary"}  text-[10px] font-bold font-inter rounded-[3px] text-white`}>
          {ext}
        </span>
      </div>
      <div className="flex-1">
        <div>
          <div className="flex justify-between items-center">
            <span className="text-secondary font-medium font-inter text-sm">
              {truncateFileName(file?.name)}
            </span>
            <div onClick={onDelete} className="text-[#A4A7AE] cursor-pointer">
              <BinIcon width={13} height={13} />
            </div>
          </div>
          <span className="text-grey-600 font-inter font-normal text-sm">
            {formatFileSize(file?.size)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-full overflow-hidden w-full h-2 bg-grey-500">
            <div style={{ width: `${progress}%` }} className="rounded-full transition-all duration-300 bg-[#314FDF] h-full" />
          </div>
          <span className="text-[#3C3F3E] font-medium text-sm font-inter">{progress}%</span>
        </div>
      </div>
    </div >
  )
}