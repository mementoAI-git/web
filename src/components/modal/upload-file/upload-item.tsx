import Docs from "@/components/docs";
import { TrashIcon } from "@/components/icons";
import { formatFileSize, truncateFileName } from "@/utility";
import type { FileState } from "./index";

interface UploadItemProps {
  file: FileState;
  onDelete: (file: FileState) => void;
}

export default function UploadItem({ file, onDelete }: UploadItemProps) {
  const name = file.file?.name ?? file.result?.name ?? "unknown";
  const size = file.file?.size ?? file.result?.size ?? 0;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-grey-500 py-3 px-4">
      <Docs name={name} />
      <div className="flex-1">
        <div>
          <div className="flex items-center justify-between">
            <span className="font-inter text-sm font-medium text-secondary">
              {truncateFileName(name, 60)}
            </span>
            <button
              type="button"
              onClick={() => onDelete(file)}
              className="cursor-pointer text-text-neutral-weaker"
            >
              <TrashIcon width={13} height={13} />
            </button>
          </div>
          <span className="font-inter text-sm font-normal text-grey-600">
            {formatFileSize(Number(size))}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-grey-500">
            <div
              className="h-full rounded-full bg-fill-info-strong transition-all duration-300"
              style={{ width: `${file.progress}%` }}
            />
          </div>
          <span className="font-inter text-sm font-medium text-text-neutral-weak">{file.progress}%</span>
        </div>
      </div>
    </div>
  );
}

