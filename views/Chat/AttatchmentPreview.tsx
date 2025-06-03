import CirclarProgress from "@/components/CirclarProgress";
import TimesIcon from "@/public/icon/times.svg"
import { IOnUploadPayload } from "./AttatchFile";

export default function AttachmentPreview({ base64, progress }: IOnUploadPayload) {
  return (
    <div className="relative size-12">
      {progress >= 100 &&
        <div className="absolute rounded-lg top-0 right-0 bottom-0 left-0 size-full flex items-center bg-black/20 justify-center">
          <CirclarProgress progress={progress} className="size-7" />
        </div>
      }
      <div className="absolute cursor-pointer text-secondary -top-1 -right-1 rounded-full size-4 flex items-center justify-center bg-white">
        <TimesIcon width={7} />
      </div>
      <div className="size-full overflow-hidden rounded-lg">
        <img src={base64} className="size-full object-cover" alt="" />
      </div>
    </div>
  )
}