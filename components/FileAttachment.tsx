import BinIcon from "@/public/icon/bin.svg"
import { cn, formatFileSize, truncateFileName } from "@/utility"
import Docs from "@/components/Docs"
import { IOnUploadPayload } from "@/utility/interface"

interface IFileUploadItem {
  file: IOnUploadPayload
  progressType?: 'bar' | "text"
  onDelete: (f: IOnUploadPayload) => void
  className?: string
}

export default function FileAttachment({ file, onDelete, progressType = "bar", className }: IFileUploadItem) {
  const name = file.file?.name ?? file.uploadedFile?.name ?? "unknown";
  const size = file.file?.size ?? file.uploadedFile?.size ?? 0;

  return (
    <div className={cn("flex items-start rounded-lg gap-3 py-3 px-4 border border-grey-500", className)}>
      <Docs name={name} />
      <div className="flex-1">
        <div>
          <div className="flex justify-between items-center">
            <span className="text-secondary font-medium font-inter text-sm">
              {truncateFileName(name)}
            </span>
            {
              file.uploadedFile &&
              <div onClick={() => onDelete(file)} className="text-[#A4A7AE] cursor-pointer">
                <BinIcon width={13} height={13} />
              </div>
            }
          </div>
          <span className="text-grey-600 font-inter font-normal text-sm">
            {formatFileSize(Number(size))}
            {
              progressType === "text" &&
              <span className="text-primary text-xs font-medium font-inter"> {file.progress}%</span>
            }
          </span>
        </div>
        {
          progressType === "bar" &&
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-full overflow-hidden w-full h-2 bg-grey-500">
              <div style={{ width: `${file.progress}%` }} className="rounded-full transition-all duration-300 bg-[#314FDF] h-full" />
            </div>
            <span className="text-[#3C3F3E] font-medium text-sm font-inter">{file.progress}%</span>
          </div>
        }
      </div>
    </div >
  )
}