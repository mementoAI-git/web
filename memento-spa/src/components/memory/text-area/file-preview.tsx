import CirclarProgress from "@/components/circlar-progress";
import { PlayIcon, QIcon } from "@/components/icons";
import { isEmpty } from "@/utility";
import type { IFile, IOnUploadPayload } from "@/utility/interface";

interface FilePreviewProps {
  files: IOnUploadPayload[];
  attachments?: IFile[];
}

const imageRotation: Record<number, string> = {
  0: "rotate-[6.76deg] origin-top-left z-30",
  1: "-rotate-[5.65deg] origin-top-right z-20",
  2: "-rotate-[14.14deg] origin-top-right z-10",
};

function FileThumbnailItem({ file, size = 50 }: { file: IOnUploadPayload; size: number }) {
  const url = file?.base64 || file.uploadedFile?.url || "";
  const type = file.uploadedFile?.type || file.file?.type || "image/jpeg";

  if (type.includes("image")) {
    return <img width={size} height={size} className="size-full rounded-[5.6px] object-cover" src={url} alt="Preview" />;
  }

  return (
    <div className="flex size-full items-center justify-center rounded-[5.6px] bg-grey-500">
      {type.includes("video") ? <PlayIcon width={size * 0.6} height={size * 0.6} /> : <QIcon width={size * 0.6} height={size * 0.6} />}
    </div>
  );
}

export function FilePreview({ files, attachments = [] }: FilePreviewProps) {
  const allFiles: IOnUploadPayload[] = [
    ...attachments.map((attachment) => ({
      id: attachment._id,
      uploadedFile: attachment,
      progress: 100,
      base64: undefined,
      file: null,
    })),
    ...files,
  ];

  if (isEmpty(allFiles)) return null;

  return (
    <div className="relative px-3 pt-3 pb-1">
      <div className="relative h-[60px] w-[60px] cursor-pointer">
        {allFiles.length === 1 ? (
          <div className="flex size-full items-center justify-center overflow-hidden rounded-[5.6px]">
            <FileThumbnailItem file={allFiles[0]} size={50} />
            {allFiles[0].progress !== 100 && (
              <div className="absolute inset-0 flex items-center justify-center rounded-[5.6px] bg-black/20">
                <CirclarProgress progress={allFiles[0].progress || 0} className="size-6" />
              </div>
            )}
          </div>
        ) : (
          <div className="relative size-full">
            {allFiles
              .slice(-3)
              .reverse()
              .map((file, index) => (
                <div
                  key={file.id || index}
                  className={`absolute top-1/2 left-1/2 h-[50px] w-[50px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[5.6px] border-[1.5px] border-white ${imageRotation[index]}`}
                >
                  <FileThumbnailItem file={file} size={50} />

                  {file.progress !== 100 && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-[5.6px] bg-black/20">
                      <CirclarProgress progress={file.progress || 0} className="size-6" />
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        {allFiles.length > 3 && (
          <div className="absolute -right-6 -top-1 z-40 rounded-full border border-white bg-black px-2 py-[2px] text-xs text-[#C1FDC5]">
            +{allFiles.length - 3} files
          </div>
        )}
      </div>
    </div>
  );
}
