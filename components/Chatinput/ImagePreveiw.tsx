import { IOnUploadPayload } from "@/utility/interface";
import Spinner from "../Spinner";

interface IImagePreviewProps {
  files: IOnUploadPayload[]
  handleRemoveFile: (id: string) => void
}
export default function ImagePreview({ files, handleRemoveFile }: IImagePreviewProps) {

  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {files.map((file) => (
        <div key={file.id} className="relative group">
          <div className="relative w-12 h-12 rounded-md overflow-hidden border border-sand-4">
            {file.base64 ? (
              <img
                src={file.base64}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-sand-2 flex items-center justify-center">
                <Spinner loading className="!size-3 !text-blue-6" />
              </div>
            )}

            {/* Upload Progress */}
            {file.progress > 0 && file.progress < 100 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-[10px] font-medium">
                  {file.progress}%
                </div>
              </div>
            )}

            {/* Delete Button */}
            <button
              onClick={() => handleRemoveFile(file.id)}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}