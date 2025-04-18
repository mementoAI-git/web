import FileIcon from "@/public/icon/file.svg";
import BinIcon from "@/public/icon/bin.svg";
import { formatFileSize, truncateFileName } from "@/utility";
import { IFileState } from ".";

interface IFileUploadItem {
  file: IFileState;
  onDelete: (f: IFileState) => void;
  // onUpload: (p: IFileState, f: IFile) => void
}

const fileColors: Record<string, string> = {
  pdf: "bg-red-800",
  png: "bg-primary",
  mp4: "bg-[#314FDF]",
};

export default function FileUploadItem({ file, onDelete }: IFileUploadItem) {
  const ext = file.file.name.slice(file.file.name.lastIndexOf(".") + 1);

  return (
    <div className="flex items-start gap-3 rounded-lg border border-grey-500 px-4 py-3">
      <div className="relative h-10 w-8 text-[#D5D7DA]">
        <FileIcon />
        <span
          className={`absolute bottom-1 -left-2 p-[3px] uppercase ${fileColors[ext.toLowerCase()] || "bg-primary"} rounded-[3px] font-inter text-[10px] font-bold text-white`}
        >
          {ext}
        </span>
      </div>
      <div className="flex-1">
        <div>
          <div className="flex items-center justify-between">
            <span className="font-inter text-sm font-medium text-secondary">
              {truncateFileName(file?.file.name)}
            </span>
            {file.result && (
              <div
                onClick={() => onDelete(file)}
                className="cursor-pointer text-[#A4A7AE]"
              >
                <BinIcon width={13} height={13} />
              </div>
            )}
          </div>
          <span className="font-inter text-sm font-normal text-grey-600">
            {formatFileSize(file?.file.size)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-full flex-1 overflow-hidden rounded-full bg-grey-500">
            <div
              style={{ width: `${file.progress}%` }}
              className="h-full rounded-full bg-[#314FDF] transition-all duration-300"
            />
          </div>
          <span className="font-inter text-sm font-medium text-[#3C3F3E]">
            {file.progress}%
          </span>
        </div>
      </div>
    </div>
  );
}
