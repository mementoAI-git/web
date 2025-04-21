"use client"

import ChevronLeftIcon from "@/public/icon/chevron-left.svg";
import Image from "next/image";
import { useRouter } from "next/navigation";
import wave from "@/public/image/wave.png"
import { IFile, IMemory } from "@/utility/interface";
import { getDuration } from "@/utility";
import { useModal } from "@/hooks/use-modal";

function FilePreview({ files }: { files: IFile[] }) {
  const { open } = useModal()
  return (
    <div onClick={() => open("file-preview", files)} className="flex flex-wrap gap-2">
      {
        files.map((file, i) => {
          if (file.type.includes("video")) {
            return <span className="h-50 max-w-94 grow rounded-lg bg-grey-400 overflow-hidden"></span>
          }
          if (file.type.includes("audio")) {
            const { mins, secs, hrs } = getDuration(new Audio(file.url).duration || 0)
            return (
              <div className="h-50 max-w-94 flex flex-col justify-between grow rounded-lg bg-grey-400 overflow-hidden">
                <div className="flex flex-col font-inter p-3">
                  <span className="font-medium text-sm text-[#050709]">{file.name}</span>
                  <span className="text-grey-600 text-xs">{hrs}:{mins}:{secs}</span>
                </div>
                <Image src={wave} alt="wave" />
              </div>
            )
          }
          return (
            <Image
              src={file.url}
              className="max-h-50 max-w-61.5 grow rounded-sm border object-cover"
              alt=""
            />
          )
        })
      }
    </div>
  )
}

export default function MemoryDetails({ memory }: { memory: IMemory }) {
  const router = useRouter()

  return (
    <div className="space-y-3">
      <button onClick={() => router.back()} className="flex cursor-pointer items-center gap-1 rounded-full bg-grey-400 px-3 py-1.5 text-black">
        <ChevronLeftIcon width={10} height={10} />
        <span className="font-inter text-sm text-grey-600">Back</span>
      </button>
      <span className="font-bricolage text-4xl font-medium text-[#101828]">
        {memory?.title}
      </span>
      <div className="mt-3 border-t border-grey-500" />
      <FilePreview files={memory?.attachments || []} />
      <div className="font-inter text-sm text-grey-600">
        <span>{memory?.body}</span>
      </div>
    </div>
  );
}
