import CirclarProgress from "@/components/circlar-progress";
import { PlayIcon, QIcon, TimesIcon } from "@/components/icons";
import { isEmpty } from "@/utility";
import type { IFile, IOnUploadPayload } from "@/utility/interface";

interface FilePreviewProps {
  files: IOnUploadPayload[];
  attachments?: IFile[];
  onRemoveFile?: (fileId: string) => void;
  onRemoveAttachment?: (attachmentId: string) => void;
}

const imageRotation: Record<number, string> = {
  0: "rotate-[6.76deg] origin-top-left z-30",
  1: "-rotate-[5.65deg] origin-top-right z-20",
  2: "-rotate-[14.14deg] origin-top-right z-10",
};

interface FileThumbnailItemProps {
  file: IOnUploadPayload;
  size?: number;
  onRemove?: () => void;
}

function FileThumbnailItem({ file, size = 50, onRemove }: FileThumbnailItemProps) {
  const url = file?.base64 || file.uploadedFile?.url || "";
  const type = file.uploadedFile?.type || file.file?.type || "image/jpeg";

  return (
    <div className="relative size-full group">
      {type.includes("image") ? (
        <img width={size} height={size} className="size-full rounded-[5.6px] object-cover" src={url} alt="Preview" />
      ) : (
        <div className="flex size-full items-center justify-center rounded-[5.6px] bg-grey-500">
          {type.includes("video") ? <PlayIcon width={size * 0.6} height={size * 0.6} /> : <QIcon width={size * 0.6} height={size * 0.6} />}
        </div>
      )}

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600 z-50"
          aria-label="Remove file"
        >
          <TimesIcon width={10} height={10} />
        </button>
      )}

      {file.progress !== 100 && file.progress !== undefined && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[5.6px] bg-black/20">
          <CirclarProgress progress={file.progress || 0} className="size-6" />
        </div>
      )}
    </div>
  );
}

export function FilePreview({ files, attachments = [], onRemoveFile, onRemoveAttachment }: FilePreviewProps) {
  const attachmentFiles: IOnUploadPayload[] = attachments.map((attachment) => ({
    id: attachment._id,
    uploadedFile: attachment,
    progress: 100,
    base64: undefined,
    file: null,
  }));

  const allFiles: IOnUploadPayload[] = [...attachmentFiles, ...files];

  if (isEmpty(allFiles)) return null;

  const handleRemove = (file: IOnUploadPayload) => {
    // Check if it's an attachment (has _id and is in attachments list)
    const isAttachment = attachments.some((att) => att._id === file.id);

    if (isAttachment && onRemoveAttachment && file.id) {
      onRemoveAttachment(file.id);
    } else if (!isAttachment && onRemoveFile && file.id) {
      onRemoveFile(file.id);
    }
  };

  return (
    <div className="relative px-3 pt-3 pb-1">
      <div className="relative h-[60px] w-[60px]">
        {allFiles.length === 1 ? (
          <div className="flex size-full items-center justify-center overflow-visible rounded-[5.6px]">
            <FileThumbnailItem
              file={allFiles[0]}
              size={50}
              onRemove={() => handleRemove(allFiles[0])}
            />
          </div>
        ) : (
          <div className="relative size-full">
            {allFiles
              .slice(-3)
              .reverse()
              .map((file, index) => (
                <div
                  key={file.id || index}
                  className={`absolute top-1/2 left-1/2 h-[50px] w-[50px] -translate-x-1/2 -translate-y-1/2 overflow-visible rounded-[5.6px] border-[1.5px] border-white ${imageRotation[index]}`}
                >
                  <FileThumbnailItem
                    file={file}
                    size={50}
                    onRemove={() => handleRemove(file)}
                  />
                </div>
              ))}
          </div>
        )}

        {allFiles.length > 3 && (
          <div className="absolute -right-6 -top-1 z-40 rounded-full border border-white bg-black px-2 py-[2px] text-xs text-text-success-weaker">
            +{allFiles.length - 3} files
          </div>
        )}
      </div>
    </div>
  );
}
