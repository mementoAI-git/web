import MicIcon from "@/public/icon/mic.svg";
import EmojiIcon from "@/public/icon/emoji.svg";
import PlusIcon from "@/public/icon/plus.svg";

interface IChatInput {
  text: string
  onChangeText: (str: string) => void;
  onSend: () => void
  disabled?: boolean
}

export default function ChatInput({ disabled = false, text = "", onChangeText, onSend }: IChatInput) {
  return (
    <div className="z-30">
      <div className=" w-full border border-primary rounded-2xl mt-auto p-10 flex flex-col gap-8 min-h-46 bg-white z-50">
        <textarea
          className="h-fit outline-none resize-none placeholder:text-grey-800 font-inter font-normal"
          value={text}
          onChange={e => onChangeText(e.target.value)}
          placeholder="What’s on your mind today? Click here to start typing, or click on the record button to say something. "
        ></textarea>
        <div className="items-center justify-between flex">
          <div
            className="flex size-12 cursor-pointer items-center justify-center rounded-full border border-[#EAECF0]"
          >
            <PlusIcon width={20} height={20} />
          </div>

          <div className="text-[#344054] flex gap-3 items-center">
            <div className="size-12 flex justify-center cursor-pointer items-center">
              <MicIcon width={14} height={20} />
            </div>
            <div className="size-12 flex justify-center cursor-pointer  items-center">
              <EmojiIcon width={20} height={20} />
            </div>
            <button disabled={disabled} type="button" onClick={onSend} className="btn">Send</button>
          </div>
        </div>
      </div>
    </div>
  )
}
