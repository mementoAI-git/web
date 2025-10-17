import { IFile, IOnUploadPayload } from "@/utility/interface";
import { isEmpty } from "lodash";
import CirclarProgress from "../../CirclarProgress";
import Image from "next/image";
import QIcon from "@/public/icon/q.svg";
import PlayIcon from "@/public/icon/play.svg";

interface IFilePreviewProps {
  files: IOnUploadPayload[]
  attachments?: IFile[]
}

const imageRotation: Record<number, string> = {
  0: "rotate-[6.76deg] origin-top-left z-30",
  1: "-rotate-[5.65deg] origin-top-right z-20",
  2: "-rotate-[14.14deg] origin-top-right z-10",
};

function FileThumbnailItem({
  file,
  size = 50,
}: { file: any; size: number }) {
  const url = file?.base64 || file.uploadedFile?.url || '';
  const type = file.uploadedFile?.type || file.file?.type || 'image/jpeg';

  if (type.includes("image")) {
    return (
      <Image
        width={size}
        height={size}
        className="size-full rounded-[5.6px] object-cover"
        src={url}
        alt="Preview"
      />
    );
  }
  return (
    <div className="size-full justify-center items-center flex bg-grey-500 rounded-[5.6px]">
      {
        type.includes('video') ?
          <PlayIcon width={size * 0.6} height={size * 0.6} /> :
          <QIcon width={size * 0.6} height={size * 0.6} />
      }
    </div>
  );
}

export function FilePreview({ files, attachments = [] }: IFilePreviewProps) {
  // Merge files and attachments into a unified list
  const allFiles = [
    // Convert attachments to a format compatible with files
    ...attachments.map((attachment) => ({
      id: attachment._id,
      uploadedFile: attachment,
      progress: 100,
      base64: undefined,
      file: null
    })),
    // Add files as they are
    ...files
  ]

  if (isEmpty(allFiles)) return null

  return (
    <div className="relative px-3 pt-3 pb-1">
      <div className="relative w-[60px] h-[60px] cursor-pointer">
        {allFiles.length === 1 ? (
          <div className="flex items-center justify-center size-full overflow-hidden rounded-[5.6px]">
            <FileThumbnailItem file={allFiles[0]} size={50} />
            {allFiles[0].progress !== 100 && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-[5.6px]">
                <CirclarProgress progress={allFiles[0].progress || 0} className="size-6" />
              </div>
            )}
          </div>
        ) : (
          <div className="relative size-full">
            {allFiles
              .slice(-3)
              .reverse()
              .map((file, i) => (
                <div
                  key={file.id || i}
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50px] h-[50px] border-[1.5px] rounded-[5.6px] ${imageRotation[i]} overflow-hidden border-white`}
                >
                  <FileThumbnailItem file={file} size={50} />

                  {file.progress !== 100 && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-[5.6px]">
                      <CirclarProgress progress={file.progress || 0} className="size-6" />
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        {allFiles.length > 3 && (
          <div className="absolute z-40 -top-1 -right-6 rounded-full text-xs text-[#C1FDC5] bg-black py-[2px] px-2 border border-white">
            +{allFiles.length - 3} files
          </div>
        )}
      </div>
    </div>
  )
}