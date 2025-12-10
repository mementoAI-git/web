import { useEffect, useState } from "react";
import type { IFile } from "@/utility/interface";
import { useModal } from "@/hooks/use-modal";
import VideoPreview from "./video";
import AudioPreview from "./audio";
import ImagePreview from "./image";

export interface FilePreviewItemBase extends IFile {
  onDelete: (id: string) => void;
}

export interface FilePreviewItem extends FilePreviewItemBase {
  isActive?: boolean;
}

interface FilePreviewProps {
  // data: IFile[];
  data: {
    files: IFile[];
    startIndex?: number;
  };
}

export default function FilePreview({ data }: FilePreviewProps) {
  const [index, setIndex] = useState(data.startIndex ?? 0);
  const [files, setFiles] = useState<IFile[]>(data.files);
  const { close } = useModal();

  useEffect(() => {
    setFiles(data.files);
    setIndex(data.startIndex ?? 0);
  }, [data.files, data.startIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const lastIndex = files.length - 1;
      if (lastIndex < 0) {
        return;
      }
      if (["ArrowLeft", "ArrowUp"].includes(event.key)) {
        setIndex((previous) => (previous <= 0 ? previous : previous - 1));
      }
      if (["ArrowRight", "ArrowDown"].includes(event.key)) {
        setIndex((previous) =>
          previous >= lastIndex ? previous : previous + 1,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [files.length]);

  const handleDelete = (id: string) => {
    const remainingFiles = files.filter((file) => file._id !== id);
    if (!remainingFiles.length) {
      close?.("file-preview");
      return;
    }
    setFiles(remainingFiles);
    setIndex((current) =>
      current >= remainingFiles.length ? remainingFiles.length - 1 : current,
    );
  };

  if (!files.length) {
    return null;
  }

  return (
    <div className="relative z-50 flex w-full flex-col items-center justify-center p-4 sm:w-[90%] sm:p-6 md:w-[80%] lg:w-[80%]">
      {files.map((file, currentIndex) => (
        <div
          key={file._id ?? currentIndex}
          className={`w-full transition-opacity duration-700 ease-in-out ${index === currentIndex ? "block opacity-100" : "hidden opacity-0"}`}
        >
          {file.type.includes("video") ? (
            <VideoPreview {...file} onDelete={handleDelete} isActive={index === currentIndex} />
          ) : file.type.includes("audio") ? (
            <AudioPreview {...file} onDelete={handleDelete} isActive={index === currentIndex} />
          ) : (
            <ImagePreview {...file} onDelete={handleDelete} />
          )}
        </div>
      ))}

      {files.length > 1 && (
        <div className="mx-auto mt-4 flex w-fit items-center justify-center gap-1 rounded-full bg-black/30 px-2 py-1 sm:mt-7">
          {files.map((_, dotIndex) => (
            <button
              type="button"
              key={`preview-dot-${dotIndex}`}
              onClick={() => setIndex(dotIndex)}
              className={`size-2 rounded-full transition ${index === dotIndex ? "bg-white" : "bg-[#C7C9C8]"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
