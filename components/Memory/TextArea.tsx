import { isEmpty } from "@/utility"
import { IFile } from "@/utility/interface"
import ImageThumbnail from "../ImageThumbnail"
import { useModal } from "@/hooks/use-modal"
import { TextareaHTMLAttributes } from "react"

interface ITextArea extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  attachments?: IFile[]
}
export function TextArea({ attachments = [], ...props }: ITextArea) {
  const { open } = useModal()
  return (
    <div className="flex min-h-[425px] flex-col gap-6 rounded-2xl bg-grey-700 p-3 font-inter text-xs">
      {!isEmpty(attachments) && (
        <div onClick={() => open("file-preview", attachments)} className="relative size-fit">
          <ImageThumbnail
            boxClassName="!rounded-[12px] !border-2"
            images={attachments}
            size={69}
          />
          {attachments.length > 3 && (
            <div className="absolute top-0 -right-10 z-40 rounded-full border border-white bg-secondary px-1.5 py-0.5 font-inter text-xs font-light text-[#C1FDC5]">
              +{attachments.length - 3} files
            </div>
          )}
        </div>
      )}

      <textarea
        {...props}
        className="size-full flex-1 resize-none outline-0 placeholder:text-[#C7C9C8]"
        placeholder="Tap to start typing..."
      ></textarea>
    </div>
  )
}