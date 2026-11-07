import { type IOnUploadPayload, type IFile } from "@/utility/interface";
import ImageThumbnail from "@/components/image-thumbnail";
import CirclarProgress from "../circlar-progress";
import { VoiceNoteTile } from "@/components/recorder/voice-note-tile";
import { displayFileName } from "@/utility/file-label";

interface IImagePreviewProps {
  files: IOnUploadPayload[]
  handleRemoveFile: (id: string) => void
}

export default function ImagePreview({ files, handleRemoveFile }: IImagePreviewProps) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {files.map((file) => {
        const mappedFile: IFile = file.uploadedFile || {
          _id: file.id,
          url: file.base64 || "",
          name: file.file?.name || "",
          size: file.file?.size || 0,
          type: file.file?.type || "",
        };

        if (mappedFile.type.startsWith("audio/")) {
          const localSrc = file.base64 || mappedFile.url;
          return (
            <div key={file.id} className="relative">
              <VoiceNoteTile
                id={file.id}
                src={localSrc}
                localFile={file.file}
                duration={file.duration}
                label={displayFileName(mappedFile.name) || "Voice note"}
                compact
                className="size-[112px]"
                onRemove={() => handleRemoveFile(file.id)}
              />
              {file.progress !== 100 && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/20">
                  <CirclarProgress progress={file.progress} className="size-7" />
                </div>
              )}
            </div>
          );
        }

        return (
          <div key={file.id} className="relative group">
            <div className="relative w-12 h-12 rounded-md border border-sand-4 flex items-center justify-center overflow-hidden">
              <div className="overflow-hidden size-full rounded-md">
                <ImageThumbnail images={[mappedFile]} size={48} />
              </div>

              {file.progress !== 100 && (
                <div className="absolute rounded-lg top-0 right-0 bottom-0 left-0 size-full flex items-center bg-black/20 justify-center">
                  <CirclarProgress progress={file.progress} className="size-7" />
                </div>
              )}

              {/* Delete Button */}
              <button
                onClick={() => handleRemoveFile(file.id)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 z-40"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}