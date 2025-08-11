import MicIcon from "@/public/icon/mic.svg";
import { KeyboardEvent, useRef, useState } from "react";
import EmojiPicker from "@/components/EmojiPicker";
import AttachmentPreview from "./AttatchmentPreview";
import AttatchFile from "./AttatchFile";
import RecordingInput from "./RecordingInput";
import { isEmpty } from "@/utility";
import useFileUpload from "@/hooks/use-file-upload";

interface IChatInput {
  text: string
  typing?: boolean
  onChangeText: (str: string) => void;
  onSend: (p: { attachments: string[] }) => void
  onStop: () => void
  disabled?: boolean
}

export default function ChatInput({ typing = false, onStop, text = "", onChangeText, onSend }: IChatInput) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const { files, setFiles, handleUpload } = useFileUpload();
  const [isRecording, setIsRecording] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChangeText(e.target.value);

    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${Math.min(ref.current.scrollHeight, 300)}px`;
    }
  };

  const handleInsertEmoji = (emoji: any) => {
    if (!ref.current) return;

    const input = ref.current;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    const newText = text.slice(0, start) + emoji.native + text.slice(end);

    onChangeText(newText);
  };

  const handleSend = () => {
    let attachments: string[] = []
    if (!isEmpty(files)) {
      attachments = files.filter(f => f.uploadedFile).map(f => f.uploadedFile._id)
    }
    onSend({ attachments })
    setFiles([])
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      text.trim();
      handleSend()
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleFinishRecording = (file: File) => {
    // Handle the recorded audio file
    console.log("Recording finished:", file);
    setIsRecording(false);

    // You can either upload it immediately or add it to attachments
    // handleUpload(file);
  };

  const handleCancelRecording = () => {
    setIsRecording(false);
  };

  // Show recording component when recording
  if (isRecording) {
    return (
      <RecordingInput
        onFinish={handleFinishRecording}
        onCancel={handleCancelRecording}
      />
    );
  }

  return (
    <div className="w-full border border-primary rounded-2xl p-4 sm:p-6 md:p-10 flex flex-col gap-4 sm:gap-6 md:gap-8 h-fit bg-white z-50">
      {
        !isEmpty(files) &&
        <div className="flex flex-wrap items-center gap-2">
          {files.map(img => <AttachmentPreview {...img} key={img.id} />)}
        </div>
      }
      <textarea
        className="max-h-60 sm:max-h-75 outline-none overflow-y-auto resize-none placeholder:text-grey-800 font-inter font-normal text-base"
        value={text}
        ref={ref}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        placeholder="What's on your mind today?"
      ></textarea>
      <div className="items-center justify-between flex flex-row gap-3 sm:gap-0">
        <AttatchFile onUpload={handleUpload} />
        <div className="text-[#344054] flex gap-2 sm:gap-3 items-center mt-2 sm:mt-0">
          <div
            className="size-10 sm:size-12 flex justify-center cursor-pointer items-center hover:bg-grey-100 rounded-full transition-colors"
          // onClick={handleStartRecording}
          >
            <MicIcon width={14} height={20} />
          </div>
          <EmojiPicker onSelect={handleInsertEmoji} />
          {
            typing ?
              <button type="button" onClick={onStop} className="btn">Stop</button> :
              <button type="button" onClick={handleSend} className="btn">Send</button>
          }
        </div>
      </div>
    </div>
  )
}