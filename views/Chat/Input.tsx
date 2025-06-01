import MicIcon from "@/public/icon/mic.svg";
import { KeyboardEvent, useRef, useState } from "react";
import EmojiPicker from "@/components/EmojiPicker";
import AttachmentPreview from "./AttatchmentPreview";
import AttatchFile, { IOnUploadPayload } from "./AttatchFile";
import useSWRMutation from "swr/mutation";
import endpoint from "@/api/endpoint";
import { fileUploadFetcher } from "@/api/fetcher";
import { toast } from "sonner";
import { isEmpty } from "@/utility";

interface IChatInput {
  text: string
  typing?: boolean
  onChangeText: (str: string) => void;
  onSend: () => void
  onStop: () => void
  disabled?: boolean
}

export default function ChatInput({ typing = false, onStop, text = "", onChangeText, onSend }: IChatInput) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const { trigger: uploadFile } = useSWRMutation(endpoint.upload, fileUploadFetcher)
  const [files, setFiles] = useState<IOnUploadPayload[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChangeText(e.target.value);

    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${Math.min(ref.current.scrollHeight, 300)}px`;
    }
  };

  const handleIUpload = async (file: IOnUploadPayload) => {
    setFiles(prev => [...prev, file])

    const result = await uploadFile({
      file: file.file,
      onProgress: (p: number) => {
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, progress: p } : f))
      }
    })

    if (!result.data[0]) {
      toast.error("Upload unsuccessful")
    } else {
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, uploadedFile: result.data[0] } : f))
    }
  }

  const handleInsertEmoji = (emoji: any) => {
    if (!ref.current) return;

    const input = ref.current;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    const newText = text.slice(0, start) + emoji.native + text.slice(end);

    onChangeText(newText);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      text.trim();
      onSend()
    }
  };
  return (
    <div className=" w-full border border-primary rounded-2xl p-10 flex flex-col gap-8 h-fit min-h-46 bg-white z-50">
      {
        !isEmpty(files) &&
        <div className="flex items-center gap-2">
          {files.map(img => <AttachmentPreview {...img} key={img.id} />)}
        </div>
      }
      <textarea
        className="max-h-75 outline-none overflow-y-auto resize-none placeholder:text-grey-800 font-inter font-normal"
        value={text}
        ref={ref}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        placeholder="What’s on your mind today? Click here to start typing, or click on the record button to say something. "
      ></textarea>
      <div className="items-center justify-between flex">
        <AttatchFile onUpload={handleIUpload} />
        <div className="text-[#344054] flex gap-3 items-center">
          <div className="size-12 flex justify-center cursor-pointer items-center">
            <MicIcon width={14} height={20} />
          </div>
          <EmojiPicker onSelect={handleInsertEmoji} />
          {
            typing ?
              <button type="button" onClick={onStop} className="btn">Stop</button> :
              <button type="button" onClick={onSend} className="btn">Send</button>
          }
        </div>
      </div>
    </div>
  )
}
