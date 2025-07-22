import { IFile } from "@/utility/interface";
import { useEffect, useState } from "react";
import VideoPreview from "./video";
import AudioPreview from "./audio";
import ImagePreview from "./image";
import { useModal } from "@/hooks/use-modal";

export interface IFilePreviewItem extends IFile {
  onDelete: (id: string) => void
}

export default function FilePreview({ data }: { data: IFile[] }) {
  const [index, setIndex] = useState(0)
  const [files, setFiles] = useState(data)
  const { close } = useModal()

  const handleKeyDown = (event: KeyboardEvent) => {
    const size = files.length - 1
    if (["ArrowLeft", "ArrowUp"].includes(event.key)) {
      setIndex(p => p <= 0 ? p : p - 1)
    }
    if (["ArrowRight", "ArrowDown"].includes(event.key)) {
      setIndex(p => p >= size ? p : p + 1)
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [])

  const onDelete = (id: string) => {
    const size = files.length - 1
    if (index >= size) {
      close("file-preview")
    } else {
      setFiles(p => p.filter(f => f._id !== id))
    }
  }

  return (
    <div className="relative z-50 flex items-center justify-center flex-col min-w-[80%]">
      {
        files.map((file, i) => (
          <div key={i} className={`transition-opacity duration-1000 ease-in-out w-full ${index === i ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
            {
              file.type.includes("video") ?
                <VideoPreview {...{ ...file, onDelete }} /> :
                file.type.includes("audio") ?
                  <AudioPreview {...{ ...file, onDelete }} /> :
                  <ImagePreview {...{ ...file, onDelete }} />
            }
          </div>
        ))
      }
      <div>
        {
          files.length > 1 &&
          <div className="mx-auto mt-7 flex w-fit items-center justify-center gap-1 rounded-full bg-black/[32%] px-2 py-1">
            {
              files.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`size-2 cursor-pointer rounded-full ${index === i ? "bg-white" : "bg-[#C7C9C8]"}`}
                />
              ))
            }
          </div>
        }
      </div>
    </div>
  );
}
