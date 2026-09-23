import Docs from "@/components/docs";
import { TrashIcon } from "@/components/icons";
import { cn, formatFileSize, truncateFileName } from "@/utility";
import type { IOnUploadPayload } from "@/utility/interface";

interface FileAttachmentProps {
  file: IOnUploadPayload;
  onDelete: (file: IOnUploadPayload) => void;
  progressType?: "bar" | "text";
  className?: string;
}

export default function FileAttachment({ file, onDelete, progressType = "bar", className }: FileAttachmentProps) {
  const name = file.file?.name ?? file.uploadedFile?.name ?? "unknown";
  const size = file.file?.size ?? file.uploadedFile?.size ?? 0;

  return (
    <div className={cn("flex items-start gap-3 rounded-lg border border-grey-500 py-3 px-4", className)}>
      <Docs name={name} />
      <div className="flex-1">
        <div>
          <div className="flex items-center justify-between">
            <span className="font-inter text-sm font-medium text-foreground">{truncateFileName(name)}</span>
            {file.uploadedFile && (
              <button
                type="button"
                onClick={() => onDelete(file)}
                className="cursor-pointer text-text-neutral-weaker"
              >
                <TrashIcon width={13} height={13} />
              </button>
            )}
          </div>
          <span className="font-inter text-sm font-normal text-grey-600">
            {formatFileSize(Number(size))}
            {progressType === "text" && (
              <span className="font-inter text-xs font-medium text-primary"> {file.progress}%</span>
            )}
          </span>
        </div>
        {progressType === "bar" && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-grey-500">
              <div
                className="h-full rounded-full bg-fill-info-strong transition-all duration-300"
                style={{ width: `${file.progress}%` }}
              />
            </div>
            <span className="font-inter text-sm font-medium text-text-neutral-weak">{file.progress}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
