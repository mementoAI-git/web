import { type IOnUploadPayload } from "@/utility/interface";
import CirclarProgress from "../circlar-progress";

interface IImagePreviewProps {
  files: IOnUploadPayload[]
  handleRemoveFile: (id: string) => void
}
export default function ImagePreview({ files, handleRemoveFile }: IImagePreviewProps) {

  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {files.map((file) => {
        const fileType = file.uploadedFile?.type || file.file?.type || "";
        const isVideo = fileType.startsWith('video/');
        const previewUrl = file.base64 || file.uploadedFile?.url || "";

        return (
        <div key={file.id} className="relative group">
          <div className="relative w-12 h-12 rounded-md border border-sand-4">
            <div className="overflow-hidden size-full rounded-md">
              {isVideo ? (
                <video
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {
              file.progress !== 100 &&
              <div className="absolute rounded-lg top-0 right-0 bottom-0 left-0 size-full flex items-center bg-black/20 justify-center">
                <CirclarProgress progress={file.progress} className="size-7" />
              </div>
            }

            {/* Delete Button */}
            <button
              onClick={() => handleRemoveFile(file.id)}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
            >
              ×
            </button>
          </div>
        </div>
        );
      })}
    </div>
  )
}